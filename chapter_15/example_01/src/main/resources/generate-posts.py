from datetime import datetime, timedelta
import random
import csv
from faker import Faker

"""
The following code was used to generate the data used by the 'trending buzzwords' examples.
It is included here as a point of reference, or for you to generate similar test data.

This script was tested against Python 2.7. Be sure to also install Faker (`pip install faker`).
"""
BUZZWORDS = [
    'alignment', 'alpha', 'antifragile', 'attractor', 'beta', 'big-data', 'blockchain',
    'brand', 'buzzword', 'cloud', 'containers', 'convergence', 'deep-learning', 'devops',
    'disruptive', 'distributed', 'dogfooding', 'dynamic', 'five-nines', 'global', 'graph',
    'holistic', 'hyperlocal', 'incubator', 'influencer', 'machine-learning', 'next-gen',
    'opensource', 'orchestration', 'paradigm', 'reliability', 'roadmap', 'runway',
    'serverless', 'startup', 'streaming', 'venture', 'virtual', 'web-scale', 'wheelhouse', 
]

MU = len(BUZZWORDS) / 2
SIGMA = MU / 3

class Post:
    def __init__(self, time, text, shares):
        self.time = time
        self.text = text
        self.shares = shares

random.seed(493493)
fake = Faker()


def pick_one_gauss(words):
    index = int(random.gauss(MU, SIGMA))
    index = min(index, len(words) - 1)
    index = max(index, 0)
    return words[index]


def chance_trend_change():
    if (random.random() < 0.001):
        print('Changing trends...')
        random.shuffle(BUZZWORDS)
        change_buildup = 0


def generate_post(buzzword, min_date, max_date):
    time = fake.date_time_between(start_date=min_date, end_date=max_date, tzinfo=None)
    words = fake.paragraph(nb_sentences=2, variable_nb_sentences=True).split(' ')
    words.insert(random.randrange(len(words) + 1), buzzword)
    text = ' '.join(words)
    shares = abs(int(random.normalvariate(1000, 200)))
    return Post(time, text, shares)


def write_csv(items, filename):
    with open(filename, 'wb') as csv_file:
        writer = csv.writer(csv_file)
        for i in items:
            writer.writerow(i.values())


def backfill(num_days, posts_per_day):
    for d in range(num_days):
        posts = []
        print('generating data for day ' + str(d))
        for h in range(24):
            offset = (d * 24) + h
            for p in range(posts_per_day / 24):
                chance_trend_change()
                buzzword = pick_one_gauss(BUZZWORDS)
                min_date = datetime.now() - timedelta(hours = (offset + 1))
                max_date = datetime.now() - timedelta(hours = (offset))
                posts.append(generate_post(buzzword, min_date, max_date))
        write_csv([p.__dict__ for p in posts], 'output/user-posts-{}.csv'.format(d))

backfill(7, 10000)
