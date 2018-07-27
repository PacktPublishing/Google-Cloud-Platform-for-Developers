package com.packtpub.gcpfordevelopers.dataflow;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.common.base.Strings;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.Compression;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.*;
import org.apache.beam.sdk.transforms.windowing.BoundedWindow;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.joda.time.Duration;
import org.joda.time.Instant;
import org.joda.time.format.DateTimeFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

import static org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED;
import static org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.WriteDisposition.WRITE_APPEND;
import static org.apache.beam.sdk.values.TypeDescriptors.strings;

public class TrendingBuzzwords {
    final static Logger logger = LoggerFactory.getLogger(TrendingBuzzwords.class);

    /**
     * Custom pipeline options allow pipeline behavior to be determined at execution time based on user inputs.
     * Here, we parameterize the input source and type (GCS or Pub/Sub), output source and type (GCS or BigQuery),
     * and the windowing size.
     */
    public interface BuzzwordsPipelineOptions extends PipelineOptions {
        @Description("Path to the input file to read. May be local or a GCS path")
        @Default.String("src/main/resources/user-posts.tar.gz")
        String getInputPath();
        void setInputPath(String filePath);
        @Description("Path to write the pipeline's output. May be local or a GCS path")
        @Default.String("results")
        String getOutputPath();
        void setOutputPath(String filePath);
        @Description("BigQuery table spec to export results, e.g. 'packt_examples.buzzword_trends'")
        String getTableSpec();
        void setTableSpec(String tableSpec);
        @Description("Pub/Sub topic to stream user posts from")
        String getPubSubTopic();
        void setPubSubTopic(String pubSubTopic);
        @Description("Number of hours per window")
        @Default.Integer(4)
        Integer getWindowHours();
        void setWindowHours(Integer windowHours);
    }

    /**
     * This custom PTransform extracts words from user posts for trend analysis through the following steps:
     *   - accepts a UserPost CSV record in the form of "[text],[shares],[datetime]"
     *   - overrides the default timestamp with the more semantic post-created datetime
     *   - flattens the words of all posts into a single PCollection<String>
     */
    static class ExtractWords extends DoFn<String, String> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            String[] parts = c.element().split(",");
            String[] words = parts[0].toLowerCase().replaceAll("[^a-z\\s'-]", "").split("\\s+");
            Instant timestamp = null;
            try {
                timestamp = Instant.parse(parts[2], DateTimeFormat.forPattern("yyyy-MM-dd HH:mm:ss"));
                for(String word : words) {
                    c.outputWithTimestamp(word, timestamp);
                }
            } catch (Exception e) {
                // In practice, we would likely want propagate exceptions a side output of the pipeine.
                // Here, we simply log errors as warnings, where they will be viewable in Stackdriver Logging.
                logger.warn(String.format("Unable to process record: '%s'", c.element()));
            }
        }
    }

    /**
     * This custom PTransform adapts word frequencies to CSV lines, with the following format:
     *     "[word],[frequency],[timestamp]"
     */
    static class TrendToCSV extends DoFn<KV<String, Long>, String>  {
        @ProcessElement
        public void processElement(ProcessContext c, BoundedWindow w) {
            String record = String.join(",",
                    c.element().getKey(),
                    c.element().getValue().toString(),
                    w.maxTimestamp().toString());
            c.output(record);
        }
    }

    /**
     * This custom PTransform converts word frequencies to BigQuery table rows. Notice that we reference
     * the BoundedWindow in order to capture the element's timestamp as part of the output. This is useful
     * for performing further time-series analysis ad hoc in BigQuery.
     */
    static class TrendToTableRows extends DoFn<KV<String, Long>, TableRow> {
        @ProcessElement
        public void processElement(ProcessContext c, BoundedWindow w) {
            TableRow tableRow = new TableRow()
                    .set("time", w.maxTimestamp().toString())
                    .set("word", c.element().getKey())
                    .set("frequency", c.element().getValue());
            c.output(tableRow);
        }
    }

    /**
     * This is the pipeline driver program's point of entry. We read user-provided pipeline options,
     * and create an appropriate Pipeline definition from those options. Finally, this method calls
     * `pipeline.run()` in order to initiate execution.
     * @param args
     */
    public static void main(String[] args) {
        BuzzwordsPipelineOptions options = PipelineOptionsFactory.fromArgs(args).as(BuzzwordsPipelineOptions.class);
        logger.info("Executing pipeline with options: {}", options);

        List<TableFieldSchema> fields = new ArrayList<>();
        fields.add(new TableFieldSchema().setName("time").setType("TIMESTAMP"));
        fields.add(new TableFieldSchema().setName("word").setType("STRING"));
        fields.add(new TableFieldSchema().setName("frequency").setType("INTEGER"));
        TableSchema schema = new TableSchema().setFields(fields);

        Pipeline pipeline = Pipeline.create(options);

        PCollection<String> input;

        if (!Strings.isNullOrEmpty(options.getPubSubTopic())) {
            logger.info("Pulling from Cloud Pub/Sub");
            input = pipeline
                    .apply("Stream input from Pub/Sub", PubsubIO.readMessages()
                            .fromTopic(options.getPubSubTopic()))
                    .apply(MapElements.into(strings()).via(msg -> new String(msg.getPayload())));
        } else {
            logger.info("Pulling from provided file path");
            input = pipeline
                    .apply("Read input CSVs", TextIO.read().from(options.getInputPath())
                            .withCompression(Compression.GZIP))
                    .apply("Filter compression headers", Filter.by(s -> s.matches("^[^\\\\=]*$")));
        }

        PCollection<KV<String, Long>> frequencies = input
            .apply("Convert to event-timed words", ParDo.of(new ExtractWords()))
            .apply("Apply windowing", Window.into(
                    FixedWindows.of(Duration.standardHours(options.getWindowHours()))))
            .apply("Tally occurrences of each word", Count.perElement());

        if (!Strings.isNullOrEmpty(options.getTableSpec())) {
            logger.info("Piping to BigQuery: " + options.getTableSpec());
            frequencies
                .apply("Map results to BQ TableRows", ParDo.of(new TrendToTableRows()))
                .apply(BigQueryIO.writeTableRows().withMethod(BigQueryIO.Write.Method.FILE_LOADS)
                    .to(options.getTableSpec())
                    .withSchema(schema)
                    .withCreateDisposition(CREATE_IF_NEEDED)
                    .withWriteDisposition(WRITE_APPEND));
        } else {
            logger.info("Piping to output path: " + options.getOutputPath());
            frequencies
                .apply("Serialize results to CSV", ParDo.of(new TrendToCSV()))
                .apply("Write CSV to target path", TextIO.write()
                    .to(options.getOutputPath() + "/buzzwords")
                    .withWindowedWrites()
                    .withSuffix(".csv"));
        }

        pipeline.run();
    }
}
