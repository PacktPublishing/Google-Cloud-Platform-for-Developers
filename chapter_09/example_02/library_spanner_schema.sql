CREATE TABLE Author (
  author_id STRING(36) NOT NULL,
  author_name STRING(128) NOT NULL,
  bio STRING(MAX)
) PRIMARY KEY(author_id);

CREATE TABLE AuthorBook (
  author_id STRING(36) NOT NULL,
  isbn STRING(36) NOT NULL,
  title STRING(200) NOT NULL,
  genre STRING(36),
  description STRING(MAX),
  date_published DATE,
) PRIMARY KEY(author_id, isbn),
INTERLEAVE IN PARENT Author ON DELETE CASCADE;

CREATE TABLE Member (
  member_id STRING(36) NOT NULL,
  member_name STRING(100) NOT NULL,
  email STRING(100) NOT NULL,
  phone_number STRING(36)
) PRIMARY KEY(member_id);

CREATE TABLE LibraryBook (
  library_book_id STRING(36) NOT NULL,
  isbn STRING(36) NOT NULL,
  book_condition STRING(36),
) PRIMARY KEY(library_book_id);

CREATE TABLE MemberBook (
  library_book_id STRING(36) NOT NULL,
  member_id STRING(36) NOT NULL,
  date_checked_out DATE
) PRIMARY KEY(library_book_id, member_id),
INTERLEAVE IN PARENT LibraryBook ON DELETE CASCADE;
