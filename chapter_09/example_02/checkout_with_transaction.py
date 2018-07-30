from google.cloud import spanner
from google.cloud.spanner_v1.proto import type_pb2
from datetime import date

instance_id = 'hello-cloud-spanner'
database_id = 'library'
max_books = 3

spanner_client = spanner.Client()
instance = spanner_client.instance(instance_id)
database = instance.database(database_id)
current_date = str(date.today())

def checkout_book(member_id, library_book_id):

    def execute_transaction(transaction):
        query = """
          SELECT COUNT(1) as num_books
          FROM MemberBook
          WHERE member_id = @member_id
        """
        result = transaction.execute_sql(
            sql=query,
            params={'member_id': member_id},
            param_types={'member_id': type_pb2.Type(code=type_pb2.STRING)})

        num_books = list(result)[0][0]

        if (num_books >= max_books):
            raise ValueError("Member has too many books checked out")

        print("Checking out book for member")

        transaction.insert(
            table='MemberBook',
            columns=('library_book_id', 'member_id', 'date_checked_out'),
            values=[(library_book_id, member_id, current_date)]
        )

    database.run_in_transaction(execute_transaction)

checkout_book('128b49df-3f2e-4721-8d87-3a24fa7825bc', '4b580c49-ba7e-4ddc-a9c6-0783ce1871e0')
