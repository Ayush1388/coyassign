ALTER TABLE `users` ADD `intent` text;--> statement-breakpoint
ALTER TABLE `users` ADD `drinking` text;--> statement-breakpoint
ALTER TABLE `users` ADD `smoking` text;--> statement-breakpoint
ALTER TABLE `users` ADD `workout` text;--> statement-breakpoint
ALTER TABLE `users` ADD `languages` text DEFAULT '[]' NOT NULL;