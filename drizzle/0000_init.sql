CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_a_id` text NOT NULL,
	`user_b_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_a_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_b_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "matches_order_ck" CHECK("matches"."user_a_id" < "matches"."user_b_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_pair_uq` ON `matches` (`user_a_id`,`user_b_id`);--> statement-breakpoint
CREATE TABLE `swipes` (
	`id` text PRIMARY KEY NOT NULL,
	`swiper_id` text NOT NULL,
	`target_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`swiper_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "swipes_action_ck" CHECK("swipes"."action" IN ('LIKE','PASS')),
	CONSTRAINT "swipes_not_self_ck" CHECK("swipes"."swiper_id" <> "swipes"."target_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `swipes_swiper_target_uq` ON `swipes` (`swiper_id`,`target_id`);--> statement-breakpoint
CREATE INDEX `swipes_target_idx` ON `swipes` (`target_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`photo_url` text,
	`bio` text DEFAULT '' NOT NULL,
	`city` text NOT NULL,
	`college` text,
	`interests` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
