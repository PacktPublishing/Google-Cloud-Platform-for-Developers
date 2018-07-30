import csv
from google.cloud import spanner

instance_id = 'hello-cloud-spanner'
database_id = 'library'

spanner_client = spanner.Client()
instance = spanner_client.instance(instance_id)
database = instance.database(database_id)

def seed_data(table_name, filename):
    with open(filename, 'r') as csv_file:
        reader = csv.reader(csv_file, delimiter=',', quotechar='|')
        columns = reader.next()
        values = [tuple(row) for row in reader]
    print("Bulk inserting {} rows into {}.{}.{}"
          .format(len(values), instance_id, database_id, table_name))
    with database.batch() as batch:
        batch.insert(
            table=table_name,
            columns=tuple(columns),
            values=values
        )
    print("Bulk insert complete")

seed_data('Author', './sample-data/authors.csv')
seed_data('AuthorBook', './sample-data/author_books.csv')
seed_data('Member', './sample-data/members.csv')
seed_data('LibraryBook', './sample-data/library_books.csv')
seed_data('MemberBook', './sample-data/member_books.csv')
