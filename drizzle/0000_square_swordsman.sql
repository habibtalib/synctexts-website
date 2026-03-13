ALTER TABLE `submissions` ADD `service_type` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `budget` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `timeline` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `lead_score` integer;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `lead_status` text NOT NULL DEFAULT 'new';
--> statement-breakpoint
ALTER TABLE `submissions` ADD `notes` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `hubspot_id` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD `hubspot_synced_at` text;
