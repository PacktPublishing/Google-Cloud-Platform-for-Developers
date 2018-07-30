from google.cloud import datastore

client = datastore.Client()

kind = 'Employee'

# Creates an Entity for the given employee
def generate_emplyee(name, title, reports_to, description):
    # Create a partial key that specifies the kind as Employee and the ancestor
    partial_key = client.key(kind, parent = reports_to)
    # Use the partial key to allocate a new ID
    # We do this ahead of time to establish ancestry between employees
    key = client.allocate_ids(partial_key, 1)[0]
    # All fields are indexed unless explicitly excluded. Here we
    # exclude the 'description' as we don't need it for queries.
    entity = datastore.Entity(key, exclude_from_indexes=[description])
    # Set the Employee properties. Note that we encode properties in unicode
    # so that Datastore does not treat them as blobs, which would be base64 encoded.
    entity.update({
        'name': unicode(name),
        'title': unicode(title),
        'description': unicode(description),
    })
    return entity

# Generate the employees
employees = []
employees.append(generate_emplyee('Sally Miller', 'CEO', None, 'Sally is a renowned leader in the community.'))
employees.append(generate_emplyee('John Green', 'Project Manager', employees[0].key, 'John pushes his team hard, but always gets results'))
employees.append(generate_emplyee('Terrence Holbrook', 'Designer', employees[1].key, 'T is a very talented designer, specializing in mobile applications'))
employees.append(generate_emplyee('Bill King', 'Engineer', employees[1].key, 'Bill is an experienced front-end developer'))
employees.append(generate_emplyee('Laura Stevens', 'Engineer', employees[1].key, 'Laura is a back-end developer that loves NoSQL'))

# Persist all employees in a batch operation.
# In practice, batch operations offer a significant performance increase.
client.put_multi(employees)

# Fetch and display all of the employees
query = client.query(kind=kind)
employees = list(query.fetch())
for e in employees:
    print("Employee {} is {} the {}, who has {} ancestors"
          .format(e.id, e['name'], e['title'], len(e.key.path) - 1))
