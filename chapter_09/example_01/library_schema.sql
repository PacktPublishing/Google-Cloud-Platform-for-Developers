CREATE TABLE IF NOT EXISTS `authors` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `bio` VARCHAR(1000),
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `author_books` (
	`isbn` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`genre` varchar(36),
	`description` varchar(1000),
	`date_published` DATE,
	PRIMARY KEY (`isbn`)
);

CREATE TABLE IF NOT EXISTS `library_books` (
	`id` varchar(36) NOT NULL,
	`isbn` varchar(36) NOT NULL,
	`book_condition` varchar(36),
	PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `members` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`phone_number` varchar(36),
	PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `member_books` (
	`member_id` varchar(36) NOT NULL,
	`book_id` varchar(36) NOT NULL,
	`date_checked_out` DATE NOT NULL
);

ALTER TABLE `author_books` ADD CONSTRAINT `author_books_fk0` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`);

ALTER TABLE `library_books` ADD CONSTRAINT `library_books_fk0` FOREIGN KEY (`isbn`) REFERENCES `author_books`(`isbn`);

ALTER TABLE `member_books` ADD CONSTRAINT `member_books_fk0` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`);

ALTER TABLE `member_books` ADD CONSTRAINT `member_books_fk1` FOREIGN KEY (`book_id`) REFERENCES `library_books`(`id`);
