CREATE TABLE `ai_coach_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`mode` text NOT NULL,
	`input_summary` text NOT NULL,
	`output_summary` text NOT NULL,
	`boundary` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ai_coach_events_session_created_idx` ON `ai_coach_events` (`session_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `evidence_items` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`reference` text NOT NULL,
	`result` text NOT NULL,
	`markdown_path` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `evidence_items_session_created_idx` ON `evidence_items` (`session_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `knowledge_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`module_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`source_ids` text NOT NULL,
	`evidence_ids` text NOT NULL,
	`related_card_ids` text NOT NULL,
	`maturity` text NOT NULL,
	`confidence` integer NOT NULL,
	`summary` text NOT NULL,
	`markdown_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `learning_tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `learning_modules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_cards_track_slug_unique` ON `knowledge_cards` (`track_id`,`slug`);--> statement-breakpoint
CREATE INDEX `knowledge_cards_module_idx` ON `knowledge_cards` (`module_id`);--> statement-breakpoint
CREATE TABLE `learning_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`title` text NOT NULL,
	`sequence` integer NOT NULL,
	`status` text NOT NULL,
	`expected_outcome` text NOT NULL,
	`acceptance_criteria` text NOT NULL,
	`markdown_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `learning_tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_modules_track_sequence_unique` ON `learning_modules` (`track_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `learning_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`repository_url` text,
	`revision` text,
	`license` text,
	`ai_guidance` text NOT NULL,
	`summary` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`learning_topic_id` text,
	`source_id` text NOT NULL,
	`title` text NOT NULL,
	`objective` text NOT NULL,
	`status` text NOT NULL,
	`markdown_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`learning_topic_id`) REFERENCES `learning_topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `learning_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `learning_tracks_source_idx` ON `learning_tracks` (`source_id`);--> statement-breakpoint
CREATE INDEX `learning_tracks_topic_idx` ON `learning_tracks` (`learning_topic_id`);--> statement-breakpoint
CREATE TABLE `review_items` (
	`id` text PRIMARY KEY NOT NULL,
	`knowledge_card_id` text NOT NULL,
	`prompt` text NOT NULL,
	`answer_hint` text,
	`last_reviewed_at` text,
	`next_review_at` text NOT NULL,
	`ease` integer NOT NULL,
	`review_count` integer NOT NULL,
	`lapse_count` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`knowledge_card_id`) REFERENCES `knowledge_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `review_items_queue_idx` ON `review_items` (`status`,`next_review_at`);--> statement-breakpoint
CREATE INDEX `review_items_card_idx` ON `review_items` (`knowledge_card_id`);--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`planning_period_id` text,
	`time_block_id` text,
	`task_link_id` text,
	`started_at` text,
	`ended_at` text,
	`status` text NOT NULL,
	`question` text NOT NULL,
	`pre_understanding` text NOT NULL,
	`attempt_summary` text,
	`blocker` text,
	`outcome` text,
	`markdown_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `learning_modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`planning_period_id`) REFERENCES `planning_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`time_block_id`) REFERENCES `time_blocks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_link_id`) REFERENCES `task_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `study_sessions_module_created_idx` ON `study_sessions` (`module_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `study_sessions_period_idx` ON `study_sessions` (`planning_period_id`);--> statement-breakpoint
CREATE INDEX `study_sessions_time_block_idx` ON `study_sessions` (`time_block_id`);--> statement-breakpoint
CREATE INDEX `study_sessions_task_link_idx` ON `study_sessions` (`task_link_id`);