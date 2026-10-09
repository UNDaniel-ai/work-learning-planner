CREATE TABLE `areas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`color` text
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`area_id` text NOT NULL,
	`title` text NOT NULL,
	`horizon` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`area_id` text NOT NULL,
	`title` text NOT NULL,
	`progress_percent` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planning_period_focus_goals` (
	`period_id` text NOT NULL,
	`goal_id` text NOT NULL,
	PRIMARY KEY(`period_id`, `goal_id`),
	FOREIGN KEY (`period_id`) REFERENCES `planning_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planning_period_task_links` (
	`period_id` text NOT NULL,
	`task_link_id` text NOT NULL,
	PRIMARY KEY(`period_id`, `task_link_id`),
	FOREIGN KEY (`period_id`) REFERENCES `planning_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_link_id`) REFERENCES `task_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planning_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`period_id` text NOT NULL,
	`type` text NOT NULL,
	`wins` text NOT NULL,
	`misses` text NOT NULL,
	`adjustments` text NOT NULL,
	`planned_minutes` integer NOT NULL,
	`actual_minutes` integer NOT NULL,
	`variance_minutes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`period_id`) REFERENCES `planning_periods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_cursors` (
	`provider` text PRIMARY KEY NOT NULL,
	`cursor` text NOT NULL,
	`last_synced_at` text NOT NULL,
	`status` text NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `task_links` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`external_task_id` text NOT NULL,
	`title_snapshot` text
);
--> statement-breakpoint
CREATE TABLE `time_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`period_id` text NOT NULL,
	`area_id` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`task_link_id` text,
	`actual_minutes` integer,
	`note` text,
	FOREIGN KEY (`period_id`) REFERENCES `planning_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_link_id`) REFERENCES `task_links`(`id`) ON UPDATE no action ON DELETE no action
);
