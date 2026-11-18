CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`deliver_at` text NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "messages_body_len_ck" CHECK(length("messages"."body") BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE INDEX `messages_match_deliver_idx` ON `messages` (`match_id`,`deliver_at`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`reported_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reported_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `prompt_question` text;--> statement-breakpoint
ALTER TABLE `users` ADD `prompt_answer` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lat` real;--> statement-breakpoint
ALTER TABLE `users` ADD `lng` real;