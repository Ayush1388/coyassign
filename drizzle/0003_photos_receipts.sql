ALTER TABLE `messages` ADD `seen_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photos` text DEFAULT '[]' NOT NULL;