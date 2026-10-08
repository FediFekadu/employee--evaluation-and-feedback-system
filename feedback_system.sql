-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 22, 2026 at 06:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `feedback_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_type` enum('student','teacher','admin') NOT NULL,
  `action` varchar(100) NOT NULL,
  `resource_type` varchar(50) NOT NULL,
  `resource_id` bigint(20) UNSIGNED DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional action details in JSON format' CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IPv4 or IPv6 address',
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `user_type`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:41:51'),
(2, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:42:23'),
(3, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:42:23'),
(4, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:42:33'),
(5, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:43:28'),
(6, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:43:28'),
(7, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:43:29'),
(8, 2, 'student', 'feedback_submitted', 'feedback', 1, '{\"evaluation_id\":1,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:44:17'),
(9, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 1, '{\"evaluation_id\":1,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:44:17'),
(10, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:44:18'),
(11, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:44:46'),
(12, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 01:44:46'),
(13, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:01:36'),
(14, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:01:36'),
(15, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:04:28'),
(16, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:04:29'),
(17, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:09:56'),
(18, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:10:05'),
(19, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:10:05'),
(20, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:10:54'),
(21, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:10:55'),
(22, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:11:22'),
(23, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:11:23'),
(24, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:11:33'),
(25, 3, 'student', 'feedback_submitted', 'feedback', 2, '{\"evaluation_id\":2,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:12:19'),
(26, 3, 'student', 'evaluation_submitted', 'evaluation_submission', 2, '{\"evaluation_id\":2,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:12:19'),
(27, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:12:21'),
(28, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:12:33'),
(29, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:12:33'),
(30, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:33:32'),
(31, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:33:32'),
(32, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:35:14'),
(33, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:35:14'),
(34, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:10'),
(35, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:10'),
(36, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:13'),
(37, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:14'),
(38, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:26'),
(39, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:26'),
(40, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:31'),
(41, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:37:31'),
(42, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:38:01'),
(43, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:38:01'),
(44, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:39:56'),
(45, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:39:57'),
(46, NULL, 'admin', 'analytics_viewed', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:45:13'),
(47, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:45:25'),
(48, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:45:25'),
(49, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:45:25'),
(50, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:45:26'),
(51, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:45:28'),
(52, 2, 'student', 'feedback_submitted', 'feedback', 3, '{\"evaluation_id\":3,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:46:10'),
(53, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 3, '{\"evaluation_id\":3,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:46:10'),
(54, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:46:11'),
(55, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:46:11'),
(56, NULL, 'admin', 'analytics_viewed', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:48:22'),
(57, NULL, 'admin', 'analytics_viewed', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:48:23'),
(58, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:48:45'),
(59, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 02:48:46'),
(60, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 05:55:39'),
(61, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 05:55:39'),
(62, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 05:55:40'),
(63, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 05:55:40'),
(64, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 05:57:14'),
(65, 3, 'student', 'submission_status_checked', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 05:57:14'),
(66, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:58:20'),
(67, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:58:21'),
(68, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:58:21'),
(69, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:58:22'),
(70, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:15'),
(71, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:15'),
(72, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:15'),
(73, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:15'),
(74, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:37'),
(75, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:37'),
(76, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:55'),
(77, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-05 13:59:56'),
(78, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-06 18:38:11'),
(79, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-06 18:38:12'),
(80, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-06 18:38:12'),
(81, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-06 18:38:12'),
(82, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:26'),
(83, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:49'),
(84, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:50'),
(85, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:50'),
(86, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:50'),
(87, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:51'),
(88, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:13:51'),
(89, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:14:12'),
(90, 2, 'student', 'feedback_submitted', 'feedback', 4, '{\"evaluation_id\":4,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:15:11'),
(91, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 4, '{\"evaluation_id\":4,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:15:11'),
(92, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:15:12'),
(93, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:15:12'),
(94, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:15:12'),
(95, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:16:30'),
(96, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:16:31'),
(97, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:17:51'),
(98, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-12 15:17:51'),
(99, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:52:24'),
(100, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:52:24'),
(101, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:11'),
(102, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:12'),
(103, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:12'),
(104, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:13'),
(105, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:13'),
(106, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:13'),
(107, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:30'),
(108, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:30'),
(109, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:30'),
(110, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:31'),
(111, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:31'),
(112, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:53:31'),
(113, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:23'),
(114, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:23'),
(115, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:24'),
(116, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:24'),
(117, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:24'),
(118, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:25'),
(119, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:50'),
(120, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:50'),
(121, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:51'),
(122, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:51'),
(123, 2, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:51'),
(124, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '2026-02-17 23:54:52'),
(125, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-19 03:56:07'),
(126, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-19 03:56:07'),
(127, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 00:05:21'),
(128, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 00:05:21'),
(129, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 00:05:24'),
(130, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 00:05:24'),
(131, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 00:05:37'),
(132, NULL, 'admin', 'analytics_viewed', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 00:05:37'),
(133, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:23:49'),
(134, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:23:49'),
(135, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:24:40'),
(136, NULL, 'admin', 'analytics_viewed', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:24:41'),
(137, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:24:56'),
(138, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:24:56'),
(139, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:24:56'),
(140, 2, 'student', 'submission_status_checked', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:24:57'),
(141, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:30:23'),
(142, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:30:23'),
(143, NULL, 'admin', 'analytics_viewed', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:36:10'),
(144, NULL, 'admin', 'analytics_viewed', 'evaluation', 3, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 03:36:10'),
(145, NULL, 'admin', 'analytics_viewed', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:43:56'),
(146, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:11'),
(147, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:11'),
(148, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:12'),
(149, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:12'),
(150, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:20'),
(151, 2, 'student', 'feedback_submitted', 'feedback', 5, '{\"evaluation_id\":5,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:57'),
(152, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 5, '{\"evaluation_id\":5,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:57'),
(153, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:59'),
(154, 2, 'student', 'submission_status_checked', 'evaluation', 4, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:45:59'),
(155, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:46:13'),
(156, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-20 04:46:13'),
(157, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 00:41:18'),
(158, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 00:41:19'),
(159, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 00:42:03'),
(160, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 00:42:04'),
(161, NULL, 'admin', 'analytics_viewed', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:20:19'),
(162, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:21:27'),
(163, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:21:27'),
(164, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:21:28'),
(165, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:21:28'),
(166, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:21:29'),
(167, 2, 'student', 'feedback_submitted', 'feedback', 6, '{\"evaluation_id\":6,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:22:07'),
(168, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 6, '{\"evaluation_id\":6,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:22:07'),
(169, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:22:09'),
(170, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:22:09'),
(171, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:24:27'),
(172, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:24:27'),
(173, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:26:21'),
(174, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:26:21'),
(175, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:36:38'),
(176, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:36:39'),
(177, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:58:41'),
(178, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:58:41'),
(179, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:59:15'),
(180, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:59:15'),
(181, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:59:16'),
(182, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 19:59:16'),
(183, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:13:04'),
(184, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:13:04'),
(185, 2, 'student', 'submission_status_checked', 'evaluation', 6, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:13:05'),
(186, 2, 'student', 'submission_status_checked', 'evaluation', 5, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:13:05'),
(187, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:15:01'),
(188, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:15:02'),
(189, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:16:21'),
(190, NULL, 'admin', 'analytics_viewed', 'evaluation', 2, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-21 20:16:21'),
(191, 3, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:35:26'),
(192, 3, 'student', 'submission_status_checked', 'evaluation', 1, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:35:26'),
(193, 2, 'student', 'submission_status_checked', 'evaluation', 19, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:35:49');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_type`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(194, 2, 'student', 'submission_status_checked', 'evaluation', 33, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:35:49'),
(195, 2, 'student', 'submission_status_checked', 'evaluation', 19, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:35:50'),
(196, 2, 'student', 'submission_status_checked', 'evaluation', 33, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:35:50'),
(197, NULL, 'admin', 'analytics_viewed', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:38:27'),
(198, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:39:11'),
(199, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:39:12'),
(200, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:39:12'),
(201, 2, 'student', 'feedback_submitted', 'feedback', 129, '{\"evaluation_id\":61,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:39:49'),
(202, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 129, '{\"evaluation_id\":61,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:39:49'),
(203, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:39:50'),
(204, NULL, 'admin', 'analytics_viewed', 'evaluation', 62, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:48:25'),
(205, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:49:21'),
(206, 2, 'student', 'submission_status_checked', 'evaluation', 62, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:49:21'),
(207, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:49:22'),
(208, 2, 'student', 'submission_status_checked', 'evaluation', 62, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:49:22'),
(209, 2, 'student', 'submission_status_checked', 'evaluation', 62, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:49:29'),
(210, 2, 'student', 'feedback_submitted', 'feedback', 130, '{\"evaluation_id\":62,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:50:16'),
(211, 2, 'student', 'evaluation_submitted', 'evaluation_submission', 130, '{\"evaluation_id\":62,\"action_type\":\"create\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:50:16'),
(212, 2, 'student', 'submission_status_checked', 'evaluation', 61, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:50:18'),
(213, 2, 'student', 'submission_status_checked', 'evaluation', 62, '{\"action_type\":\"view\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '2026-02-22 03:50:19');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `year_level` varchar(255) DEFAULT NULL,
  `semester` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `department_id`, `title`, `code`, `description`, `created_at`, `updated_at`, `year_level`, `semester`) VALUES
(4, 2, 'Java', 'Jav123', NULL, '2026-02-12 15:12:04', '2026-02-12 15:12:04', '4', 'Semester I'),
(5, 2, 'Human Computer Interaction', 'HCI123', NULL, '2026-02-20 04:39:50', '2026-02-20 04:39:50', '4', 'Semester I'),
(6, 2, 'Distibuted System', 'DIs123', NULL, '2026-02-21 19:18:38', '2026-02-21 19:18:38', '4', 'Semester I'),
(24, 4, 'Introduction to Information System 3', 'IS347', 'A comprehensive introduction to Information System', '2026-02-22 02:09:12', '2026-02-22 02:09:12', '2', '2'),
(25, 2, 'Introduction to Software Engineering 1', 'SWE224', 'A comprehensive introduction to Software Engineering', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '3', '1'),
(26, 2, 'Introduction to Software Engineering 2', 'SWE111', 'A comprehensive introduction to Software Engineering', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '4', '2'),
(27, 2, 'Introduction to Software Engineering 3', 'SWE305', 'A comprehensive introduction to Software Engineering', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '4', '2'),
(28, 3, 'Introduction to Computer Science 1', 'CS152', 'A comprehensive introduction to Computer Science', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '1', '1'),
(29, 3, 'Introduction to Computer Science 2', 'CS346', 'A comprehensive introduction to Computer Science', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '4', '1'),
(30, 3, 'Introduction to Computer Science 3', 'CS208', 'A comprehensive introduction to Computer Science', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '2', '1'),
(31, 4, 'Introduction to Information System 1', 'IS329', 'A comprehensive introduction to Information System', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '4', '2'),
(32, 4, 'Introduction to Information System 2', 'IS394', 'A comprehensive introduction to Information System', '2026-02-22 02:26:41', '2026-02-22 02:26:41', '3', '1'),
(34, 2, 'Phyton', 'PHY123', NULL, '2026-02-22 03:42:07', '2026-02-22 03:42:07', '4', 'Semester II');

-- --------------------------------------------------------

--
-- Table structure for table `course_student_enrollments`
--

CREATE TABLE `course_student_enrollments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `course_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_teacher`
--

CREATE TABLE `course_teacher` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `course_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `year_level` varchar(255) DEFAULT NULL,
  `semester` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_teacher`
--

INSERT INTO `course_teacher` (`id`, `course_id`, `teacher_id`, `created_at`, `updated_at`, `year_level`, `semester`) VALUES
(6, 4, 4, NULL, NULL, '4', 'Semester I'),
(9, 5, 3, NULL, NULL, '4', 'Semester I'),
(11, 6, 5, NULL, NULL, '4', 'Semester I'),
(14, 34, 20, NULL, NULL, '4', 'Semester II');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `code`, `created_at`, `updated_at`) VALUES
(2, 'Software Engineering', 'SWE', '2026-02-05 01:38:46', '2026-02-05 01:38:46'),
(3, 'Computer Science', 'CS', '2026-02-12 15:22:22', '2026-02-12 15:22:22'),
(4, 'Information System', 'IS', '2026-02-21 23:56:38', '2026-02-21 23:56:38');

-- --------------------------------------------------------

--
-- Table structure for table `department_comments`
--

CREATE TABLE `department_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `anonymous` tinyint(1) NOT NULL DEFAULT 1,
  `target_type` enum('teacher','course','general') NOT NULL,
  `target_id` bigint(20) UNSIGNED DEFAULT NULL,
  `academic_year` varchar(255) DEFAULT NULL,
  `semester` varchar(255) DEFAULT NULL,
  `year_level` varchar(255) DEFAULT NULL,
  `text` text NOT NULL,
  `department_reply` text DEFAULT NULL,
  `department_reply_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `moderation_notes` text DEFAULT NULL,
  `flagged` tinyint(1) NOT NULL DEFAULT 0,
  `flag_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `course_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department_comments`
--

INSERT INTO `department_comments` (`id`, `department_id`, `student_id`, `anonymous`, `target_type`, `target_id`, `academic_year`, `semester`, `year_level`, `text`, `department_reply`, `department_reply_at`, `status`, `moderation_notes`, `flagged`, `flag_reason`, `created_at`, `updated_at`, `teacher_id`, `course_id`) VALUES
(2, 2, 2, 1, 'general', NULL, NULL, 'Semester I', '4', 'hey when do we start class', 'i do not know', '2026-02-05 02:01:14', 'pending', NULL, 0, NULL, '2026-02-05 01:44:37', '2026-02-05 02:01:14', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `department_hod_evaluation_templates`
--

CREATE TABLE `department_hod_evaluation_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `form_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_info`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department_hod_evaluation_templates`
--

INSERT INTO `department_hod_evaluation_templates` (`id`, `department_id`, `name`, `description`, `is_active`, `form_info`, `created_at`, `updated_at`) VALUES
(1, 2, 'Comprehensive Teacher Evaluation Template', 'Department evaluation template with comprehensive questions covering instructional skills, professional ethics, and assessment methods.', 1, '{\"university\":\"BULE-HORA UNIVERSITY\",\"formTitle\":\"Head of Department Teacher Evaluation Criteria\",\"year\":2026,\"semester\":\"First\"}', '2026-02-20 02:23:40', '2026-02-20 02:44:46'),
(2, 3, 'Standard HOD Evaluation Template', 'Standard evaluation criteria for Head of Department assessment of faculty.', 1, '{\"version\":\"1.0\"}', '2026-02-20 02:24:30', '2026-02-20 02:24:30');

-- --------------------------------------------------------

--
-- Table structure for table `department_peer_evaluation_templates`
--

CREATE TABLE `department_peer_evaluation_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `form_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_info`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department_peer_evaluation_templates`
--

INSERT INTO `department_peer_evaluation_templates` (`id`, `department_id`, `name`, `description`, `is_active`, `form_info`, `created_at`, `updated_at`) VALUES
(1, 2, 'Comprehensive Teacher Evaluation Template', 'Department evaluation template with comprehensive questions covering instructional skills, professional ethics, and assessment methods.', 1, '{\"university\":\"BULE-HORA UNIVERSITY\",\"formTitle\":\"Peer-to-Peer Teacher Evaluation Criteria\",\"year\":2026,\"semester\":\"First\"}', '2026-02-05 01:43:14', '2026-02-05 01:43:14');

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `course_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `academic_year` varchar(255) NOT NULL,
  `year_level` tinyint(3) UNSIGNED DEFAULT NULL,
  `semester` varchar(255) NOT NULL,
  `opened_at` date NOT NULL,
  `closed_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `last_modified_at` timestamp NULL DEFAULT NULL,
  `last_modified_by` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `evaluations`
--

INSERT INTO `evaluations` (`id`, `course_id`, `teacher_id`, `academic_year`, `year_level`, `semester`, `opened_at`, `closed_at`, `created_at`, `updated_at`, `department_id`, `last_modified_at`, `last_modified_by`) VALUES
(61, 6, 5, '2026', 4, 'Semester I', '2026-02-21', NULL, '2026-02-22 03:38:23', '2026-02-22 03:38:23', 2, NULL, NULL),
(62, 34, 20, '2026', 4, 'Semester II', '2026-02-21', NULL, '2026-02-22 03:48:21', '2026-02-22 03:48:21', 2, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_analytics`
--

CREATE TABLE `evaluation_analytics` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `total_eligible_students` int(11) NOT NULL,
  `total_submissions` int(11) NOT NULL,
  `participation_rate` decimal(5,2) NOT NULL COMMENT 'Percentage with 2 decimal places',
  `average_rating` decimal(3,2) DEFAULT NULL COMMENT 'Average rating with 2 decimal places',
  `weighted_score` decimal(5,2) DEFAULT NULL COMMENT 'Weighted score with 2 decimal places',
  `calculated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_questions`
--

CREATE TABLE `evaluation_questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `evaluation_questions`
--

INSERT INTO `evaluation_questions` (`id`, `evaluation_id`, `question_id`, `order`, `created_at`, `updated_at`) VALUES
(22621, 61, 175, 1, NULL, NULL),
(22622, 61, 176, 2, NULL, NULL),
(22623, 61, 177, 3, NULL, NULL),
(22624, 61, 178, 4, NULL, NULL),
(22625, 61, 179, 5, NULL, NULL),
(22626, 61, 180, 6, NULL, NULL),
(22627, 61, 181, 7, NULL, NULL),
(22628, 61, 182, 8, NULL, NULL),
(22629, 61, 183, 9, NULL, NULL),
(22630, 61, 184, 10, NULL, NULL),
(22631, 61, 185, 11, NULL, NULL),
(22632, 61, 186, 12, NULL, NULL),
(22633, 61, 187, 13, NULL, NULL),
(22634, 61, 188, 14, NULL, NULL),
(22635, 61, 189, 15, NULL, NULL),
(22636, 61, 190, 16, NULL, NULL),
(22637, 61, 191, 17, NULL, NULL),
(22638, 61, 192, 18, NULL, NULL),
(22639, 61, 193, 19, NULL, NULL),
(22640, 61, 194, 20, NULL, NULL),
(22641, 61, 195, 21, NULL, NULL),
(22642, 61, 196, 22, NULL, NULL),
(22643, 61, 197, 23, NULL, NULL),
(22644, 61, 198, 24, NULL, NULL),
(22645, 61, 199, 25, NULL, NULL),
(22646, 61, 200, 26, NULL, NULL),
(22647, 61, 201, 27, NULL, NULL),
(22648, 61, 202, 28, NULL, NULL),
(22649, 61, 203, 29, NULL, NULL),
(22650, 62, 204, 1, NULL, NULL),
(22651, 62, 205, 2, NULL, NULL),
(22652, 62, 206, 3, NULL, NULL),
(22653, 62, 207, 4, NULL, NULL),
(22654, 62, 208, 5, NULL, NULL),
(22655, 62, 209, 6, NULL, NULL),
(22656, 62, 210, 7, NULL, NULL),
(22657, 62, 211, 8, NULL, NULL),
(22658, 62, 212, 9, NULL, NULL),
(22659, 62, 213, 10, NULL, NULL),
(22660, 62, 214, 11, NULL, NULL),
(22661, 62, 215, 12, NULL, NULL),
(22662, 62, 216, 13, NULL, NULL),
(22663, 62, 217, 14, NULL, NULL),
(22664, 62, 218, 15, NULL, NULL),
(22665, 62, 219, 16, NULL, NULL),
(22666, 62, 220, 17, NULL, NULL),
(22667, 62, 221, 18, NULL, NULL),
(22668, 62, 222, 19, NULL, NULL),
(22669, 62, 223, 20, NULL, NULL),
(22670, 62, 224, 21, NULL, NULL),
(22671, 62, 225, 22, NULL, NULL),
(22672, 62, 226, 23, NULL, NULL),
(22673, 62, 227, 24, NULL, NULL),
(22674, 62, 228, 25, NULL, NULL),
(22675, 62, 229, 26, NULL, NULL),
(22676, 62, 230, 27, NULL, NULL),
(22677, 62, 231, 28, NULL, NULL),
(22678, 62, 232, 29, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_submissions`
--

CREATE TABLE `evaluation_submissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 1,
  `submission_hash` varchar(255) NOT NULL COMMENT 'For integrity verification',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `evaluation_submissions`
--

INSERT INTO `evaluation_submissions` (`id`, `evaluation_id`, `student_id`, `submitted_at`, `is_anonymous`, `submission_hash`, `created_at`, `updated_at`) VALUES
(129, 61, 2, '2026-02-22 03:39:49', 1, '$2y$10$TkMVU5rckA42ZnCUbpkeiO/6RV4Z3URaim3i1DOJdhhcRTG/lVP/6', '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(130, 62, 2, '2026-02-22 03:50:16', 1, '$2y$10$VCTdWe3KLf3GhnCOE.WESupBw5VH.TN4zCTZfwg6NKxe9Jd2bP0py', '2026-02-22 03:50:16', '2026-02-22 03:50:16');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedbacks`
--

CREATE TABLE `feedbacks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `anonymous` tinyint(1) NOT NULL DEFAULT 1,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `submission_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Prevents modification after submission'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `feedbacks`
--

INSERT INTO `feedbacks` (`id`, `evaluation_id`, `student_id`, `anonymous`, `comments`, `created_at`, `updated_at`, `submission_id`, `is_locked`) VALUES
(129, 61, 2, 1, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49', 129, 1),
(130, 62, 2, 1, 'I like ur teaching way', '2026-02-22 03:50:16', '2026-02-22 03:50:16', 130, 1);

-- --------------------------------------------------------

--
-- Table structure for table `hod_evaluations`
--

CREATE TABLE `hod_evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `academic_year` varchar(255) NOT NULL,
  `semester` varchar(255) NOT NULL,
  `opened_at` date NOT NULL,
  `closed_at` date DEFAULT NULL,
  `template_id` bigint(20) UNSIGNED DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `hod_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hod_evaluations`
--

INSERT INTO `hod_evaluations` (`id`, `department_id`, `teacher_id`, `academic_year`, `semester`, `opened_at`, `closed_at`, `template_id`, `score`, `remarks`, `hod_user_id`, `status`, `created_at`, `updated_at`) VALUES
(2, 2, 2, '2026', 'Semester I', '2026-02-04', NULL, NULL, 75.38, 'Good', 3, 'submitted', '2026-02-05 02:09:54', '2026-02-20 03:29:36'),
(3, 2, 3, '2026', 'Semester I', '2026-02-04', NULL, NULL, 100.00, NULL, 3, 'submitted', '2026-02-05 02:45:10', '2026-02-20 04:08:11'),
(4, 2, 4, '2026', 'Semester I', '2026-02-11', NULL, NULL, 88.46, NULL, 3, 'submitted', '2026-02-12 15:13:24', '2026-02-20 03:21:18'),
(8, 2, 5, '2026', 'Semester I', '2026-02-21', NULL, NULL, 70.91, NULL, 3, 'submitted', '2026-02-21 19:20:16', '2026-02-21 19:20:36'),
(9, 2, 20, '2026', 'Semester II', '2026-02-21', NULL, NULL, 81.82, NULL, 3, 'submitted', '2026-02-22 03:48:21', '2026-02-22 03:48:55');

-- --------------------------------------------------------

--
-- Table structure for table `hod_evaluation_responses`
--

CREATE TABLE `hod_evaluation_responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hod_evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `hod_template_question_id` bigint(20) UNSIGNED NOT NULL,
  `rating` int(11) DEFAULT NULL COMMENT '1-5 scale usually',
  `text` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hod_evaluation_responses`
--

INSERT INTO `hod_evaluation_responses` (`id`, `hod_evaluation_id`, `hod_template_question_id`, `rating`, `text`, `created_at`, `updated_at`) VALUES
(1, 4, 89, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(2, 4, 90, 5, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(3, 4, 91, 5, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(4, 4, 92, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(5, 4, 93, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(6, 4, 94, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(7, 4, 95, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(8, 4, 96, 5, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(9, 4, 97, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(10, 4, 98, 5, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(11, 4, 99, 4, NULL, '2026-02-20 03:21:17', '2026-02-20 03:21:17'),
(27, 2, 89, 5, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(28, 2, 90, 1, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(29, 2, 91, 1, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(30, 2, 92, 1, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(31, 2, 93, 1, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(32, 2, 94, 1, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(33, 2, 95, 1, NULL, '2026-02-20 03:29:35', '2026-02-20 03:29:35'),
(34, 2, 96, 1, NULL, '2026-02-20 03:29:36', '2026-02-20 03:29:36'),
(35, 2, 97, 1, NULL, '2026-02-20 03:29:36', '2026-02-20 03:29:36'),
(36, 2, 98, 5, NULL, '2026-02-20 03:29:36', '2026-02-20 03:29:36'),
(37, 2, 99, 5, NULL, '2026-02-20 03:29:36', '2026-02-20 03:29:36'),
(79, 3, 89, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(80, 3, 90, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(81, 3, 91, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(82, 3, 92, NULL, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(83, 3, 93, NULL, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(84, 3, 94, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(85, 3, 95, NULL, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(86, 3, 96, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(87, 3, 97, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(88, 3, 98, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(89, 3, 99, 5, NULL, '2026-02-20 04:08:11', '2026-02-20 04:08:11'),
(91, 8, 89, 1, NULL, '2026-02-21 19:20:35', '2026-02-21 19:20:35'),
(92, 8, 90, 5, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(93, 8, 91, 5, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(94, 8, 92, 5, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(95, 8, 93, 3, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(96, 8, 94, 2, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(97, 8, 95, 2, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(98, 8, 96, 2, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(99, 8, 97, 4, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(100, 8, 98, 5, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(101, 8, 99, 5, NULL, '2026-02-21 19:20:36', '2026-02-21 19:20:36'),
(102, 9, 89, 1, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(103, 9, 90, 2, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(104, 9, 91, 3, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(105, 9, 92, 4, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(106, 9, 93, 5, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(107, 9, 94, 5, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(108, 9, 95, 5, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(109, 9, 96, 5, NULL, '2026-02-22 03:48:54', '2026-02-22 03:48:54'),
(110, 9, 97, 5, NULL, '2026-02-22 03:48:55', '2026-02-22 03:48:55'),
(111, 9, 98, 5, NULL, '2026-02-22 03:48:55', '2026-02-22 03:48:55'),
(112, 9, 99, 5, NULL, '2026-02-22 03:48:55', '2026-02-22 03:48:55');

-- --------------------------------------------------------

--
-- Table structure for table `hod_template_questions`
--

CREATE TABLE `hod_template_questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `template_id` bigint(20) UNSIGNED NOT NULL,
  `text` text NOT NULL,
  `type` enum('rating','text') NOT NULL DEFAULT 'rating',
  `section` varchar(255) DEFAULT NULL,
  `order` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hod_template_questions`
--

INSERT INTO `hod_template_questions` (`id`, `template_id`, `text`, `type`, `section`, `order`, `created_at`, `updated_at`) VALUES
(89, 1, 'Regularity in conducting classes as per the timetable.', 'rating', NULL, 1, '2026-02-20 03:20:29', '2026-02-20 04:14:03'),
(90, 1, 'Punctuality in starting and ending classes.', 'rating', NULL, 2, '2026-02-20 03:20:29', '2026-02-20 04:14:03'),
(91, 1, 'Completion of syllabus within the stipulated time.', 'rating', NULL, 3, '2026-02-20 03:20:29', '2026-02-20 04:14:03'),
(92, 1, 'Quality of teaching materials and resources provided.', 'rating', NULL, 4, '2026-02-20 03:20:29', '2026-02-20 04:14:03'),
(93, 1, 'Use of innovative teaching methods and technology.', 'rating', NULL, 5, '2026-02-20 03:20:30', '2026-02-20 04:14:03'),
(94, 1, 'Availability to students for counseling and guidance.', 'rating', NULL, 6, '2026-02-20 03:20:30', '2026-02-20 04:14:03'),
(95, 1, 'Participation in departmental meetings and activities.', 'rating', NULL, 7, '2026-02-20 03:20:30', '2026-02-20 04:14:03'),
(96, 1, 'Contribution to curriculum development and improvement.', 'rating', NULL, 8, '2026-02-20 03:20:30', '2026-02-20 04:14:03'),
(97, 1, 'Timely submission of grades and other required documents.', 'rating', NULL, 9, '2026-02-20 03:20:30', '2026-02-20 04:14:03'),
(98, 1, 'Professional conduct and relationship with colleagues.', 'rating', NULL, 10, '2026-02-20 03:20:30', '2026-02-20 04:14:03'),
(99, 1, 'Any other specific comments or observations regarding the faculty member.', 'rating', NULL, 11, '2026-02-20 03:20:30', '2026-02-20 04:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_reset_tokens_table', 1),
(3, '2019_08_19_000000_create_failed_jobs_table', 1),
(4, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(5, '2025_11_14_000100_create_departments_table', 1),
(6, '2025_11_14_000110_create_courses_table', 1),
(7, '2025_11_14_000120_create_teachers_table', 1),
(8, '2025_11_14_000130_create_students_table', 1),
(9, '2025_11_14_000140_create_evaluations_feedback_tables', 1),
(10, '2025_11_14_000150_create_department_evaluation_templates_table', 1),
(11, '2025_11_14_000160_create_template_questions_table', 1),
(12, '2025_11_14_000170_add_section_to_questions_and_order_to_evaluation_questions', 1),
(13, '2025_11_15_000200_add_role_columns_to_users', 1),
(14, '2025_11_20_000210_add_academic_year_to_evaluations', 1),
(15, '2025_11_26_000220_add_year_level_to_evaluations', 1),
(16, '2025_11_26_000300_add_year_semester_to_students', 1),
(17, '2025_12_19_000001_create_evaluation_submissions_table', 1),
(18, '2025_12_19_000002_add_submission_tracking_to_feedbacks_table', 1),
(19, '2025_12_19_000003_create_evaluation_analytics_table', 1),
(20, '2025_12_19_000004_create_audit_logs_table', 1),
(21, '2025_12_30_061126_add_department_id_to_evaluations_table', 1),
(22, '2026_01_20_093327_add_year_level_semester_to_course_teacher_table', 1),
(23, '2026_01_20_093825_add_year_level_semester_to_courses_table', 1),
(24, '2026_01_26_000001_add_audience_to_department_templates', 1),
(25, '2026_01_26_000002_create_department_peer_evaluation_templates', 1),
(26, '2026_01_26_000003_create_peer_template_questions', 1),
(27, '2026_01_26_000004_create_department_hod_evaluation_templates', 1),
(28, '2026_01_26_000004_create_peer_evaluations', 1),
(29, '2026_01_26_000005_create_hod_template_questions', 1),
(30, '2026_01_26_000005_create_peer_evaluation_assignees', 1),
(31, '2026_01_26_000006_create_hod_evaluations', 1),
(32, '2026_01_26_000007_create_peer_evaluation_responses', 1),
(33, '2026_01_26_000300_rename_department_templates_to_student_templates', 1),
(34, '2026_01_26_000310_rename_template_questions_to_student_template_questions', 1),
(35, '2026_01_30_120000_add_photo_url_to_teachers_table', 1),
(36, '2026_02_03_061848_add_comments_to_feedbacks_table', 1),
(37, '2026_02_03_093500_create_department_comments_table', 1),
(38, '2026_02_03_120000_add_year_level_to_department_comments', 1),
(39, '2026_02_03_121500_add_teacher_course_to_department_comments', 1),
(40, '2026_02_04_090000_add_department_reply_to_department_comments', 1),
(41, '2026_02_04_100000_create_notifications_table', 1),
(42, '2026_02_19_181047_create_hod_evaluation_responses_table', 2),
(43, '2026_02_19_183000_modify_section_column_in_hod_template_questions', 3);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `recipient_type` varchar(255) NOT NULL,
  `recipient_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `priority` varchar(255) NOT NULL DEFAULT 'info',
  `read_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_type`, `recipient_id`, `type`, `title`, `message`, `meta`, `priority`, `read_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(2, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":1,\"course_id\":1,\"teacher_id\":1,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-05 01:42:48', NULL, '2026-02-05 01:41:49', '2026-02-05 01:42:48'),
(3, 'teacher', 1, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":1,\"course_id\":1,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-05 02:04:31', NULL, '2026-02-05 01:41:49', '2026-02-05 02:04:31'),
(4, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":1,\"course_id\":1,\"teacher_id\":1,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-05 01:45:16', NULL, '2026-02-05 01:41:49', '2026-02-05 01:45:16'),
(5, 'student', 2, 'reply', 'Department Reply', 'i do not know', '{\"comment_id\":2,\"department_id\":2,\"target_type\":\"general\",\"teacher_id\":null,\"course_id\":null}', 'info', '2026-02-05 02:01:26', NULL, '2026-02-05 02:01:14', '2026-02-05 02:01:26'),
(6, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":3}', 'info', '2026-02-05 02:30:17', NULL, '2026-02-05 02:09:54', '2026-02-05 02:30:17'),
(7, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":3}', 'info', '2026-02-05 02:12:28', NULL, '2026-02-05 02:09:54', '2026-02-05 02:12:28'),
(8, 'teacher', 2, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":2,\"course_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":3}', 'info', '2026-02-21 20:16:26', NULL, '2026-02-05 02:09:54', '2026-02-21 20:16:26'),
(9, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":3}', 'info', '2026-02-05 02:23:53', NULL, '2026-02-05 02:09:54', '2026-02-05 02:23:53'),
(10, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-05 02:45:21', NULL, '2026-02-05 02:45:10', '2026-02-05 02:45:21'),
(11, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-05 02:45:10', '2026-02-05 02:45:10'),
(12, 'teacher', 3, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":3,\"course_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-05 02:48:30', NULL, '2026-02-05 02:45:10', '2026-02-05 02:48:30'),
(13, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-05 13:31:52', NULL, '2026-02-05 02:45:10', '2026-02-05 13:31:52'),
(14, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-12 15:13:24', '2026-02-12 15:13:24'),
(15, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-12 15:13:24', '2026-02-12 15:13:24'),
(16, 'student', 4, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-12 15:13:24', '2026-02-12 15:13:24'),
(17, 'teacher', 4, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":4,\"course_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-12 15:13:24', '2026-02-12 15:13:24'),
(18, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-20 04:08:47', NULL, '2026-02-12 15:13:24', '2026-02-20 04:08:47'),
(19, 'student', 2, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:39.772719Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:39', '2026-02-20 03:40:39'),
(20, 'student', 3, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:39.772719Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:39', '2026-02-20 03:40:39'),
(21, 'student', 4, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:39.772719Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:39', '2026-02-20 03:40:39'),
(22, 'teacher', 4, 'closed', 'Evaluation Closed', 'Your evaluation has been closed', '{\"evaluation_id\":4,\"course_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:39.772719Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:39', '2026-02-20 03:40:39'),
(23, 'department', 2, 'closed', 'Evaluation Closed', 'An evaluation in your department has been closed', '{\"evaluation_id\":4,\"course_id\":4,\"teacher_id\":4,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:39.772719Z\"}', 'warning', '2026-02-20 04:08:46', NULL, '2026-02-20 03:40:40', '2026-02-20 04:08:46'),
(24, 'student', 2, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:43.795878Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:43', '2026-02-20 03:40:43'),
(25, 'student', 3, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:43.795878Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:43', '2026-02-20 03:40:43'),
(26, 'student', 4, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:43.795878Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:43', '2026-02-20 03:40:43'),
(27, 'teacher', 2, 'closed', 'Evaluation Closed', 'Your evaluation has been closed', '{\"evaluation_id\":2,\"course_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:43.795878Z\"}', 'warning', '2026-02-21 20:16:18', NULL, '2026-02-20 03:40:43', '2026-02-21 20:16:18'),
(28, 'department', 2, 'closed', 'Evaluation Closed', 'An evaluation in your department has been closed', '{\"evaluation_id\":2,\"course_id\":2,\"teacher_id\":2,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:43.795878Z\"}', 'warning', '2026-02-20 04:08:45', NULL, '2026-02-20 03:40:43', '2026-02-20 04:08:45'),
(29, 'student', 2, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:46.788882Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:46', '2026-02-20 03:40:46'),
(30, 'student', 3, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:46.788882Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:46', '2026-02-20 03:40:46'),
(31, 'student', 4, 'closed', 'Evaluation Closed', 'The evaluation has been closed', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:46.788882Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:46', '2026-02-20 03:40:46'),
(32, 'teacher', 3, 'closed', 'Evaluation Closed', 'Your evaluation has been closed', '{\"evaluation_id\":3,\"course_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:46.788882Z\"}', 'warning', NULL, NULL, '2026-02-20 03:40:46', '2026-02-20 03:40:46'),
(33, 'department', 2, 'closed', 'Evaluation Closed', 'An evaluation in your department has been closed', '{\"evaluation_id\":3,\"course_id\":3,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"closed_at\":\"2026-02-19T19:40:46.788882Z\"}', 'warning', '2026-02-20 04:08:44', NULL, '2026-02-20 03:40:46', '2026-02-20 04:08:44'),
(34, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":5,\"course_id\":5,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-20 04:43:53', '2026-02-20 04:43:53'),
(35, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":5,\"course_id\":5,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-20 04:43:53', '2026-02-20 04:43:53'),
(36, 'student', 4, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":5,\"course_id\":5,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-20 04:43:54', '2026-02-20 04:43:54'),
(37, 'teacher', 3, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":5,\"course_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-20 04:43:54', '2026-02-20 04:43:54'),
(38, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":5,\"course_id\":5,\"teacher_id\":3,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-23 01:12:27', NULL, '2026-02-20 04:43:54', '2026-02-23 01:12:27'),
(39, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":6,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(40, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":6,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(41, 'student', 4, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":6,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(42, 'teacher', 5, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":6,\"course_id\":6,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(43, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":6,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-23 01:12:26', NULL, '2026-02-21 19:20:16', '2026-02-23 01:12:26'),
(44, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(45, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(46, 'student', 4, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(47, 'student', 6, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(48, 'student', 11, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(49, 'student', 15, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(50, 'student', 20, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(51, 'student', 21, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(52, 'student', 30, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(53, 'student', 31, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(54, 'student', 32, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(55, 'student', 35, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(56, 'student', 40, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(57, 'student', 41, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(58, 'student', 42, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(59, 'student', 44, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(60, 'student', 48, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(61, 'student', 52, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(62, 'student', 54, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(63, 'teacher', 5, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":61,\"course_id\":6,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:38:24', '2026-02-22 03:38:24'),
(64, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":61,\"course_id\":6,\"teacher_id\":5,\"academic_year\":\"2026\",\"semester\":\"Semester I\",\"year_level\":4}', 'info', '2026-02-23 01:12:25', NULL, '2026-02-22 03:38:24', '2026-02-23 01:12:25'),
(65, 'student', 2, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(66, 'student', 3, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(67, 'student', 4, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(68, 'student', 6, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(69, 'student', 11, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(70, 'student', 15, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(71, 'student', 20, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(72, 'student', 21, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(73, 'student', 30, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(74, 'student', 31, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(75, 'student', 32, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(76, 'student', 35, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(77, 'student', 40, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(78, 'student', 41, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(79, 'student', 42, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(80, 'student', 44, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(81, 'student', 48, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(82, 'student', 52, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(83, 'student', 54, 'opened', 'Evaluation Opened', 'A new evaluation has been opened', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:22', '2026-02-22 03:48:22'),
(84, 'teacher', 20, 'opened', 'Evaluation Opened', 'Your evaluation is now open', '{\"evaluation_id\":62,\"course_id\":34,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', NULL, NULL, '2026-02-22 03:48:23', '2026-02-22 03:48:23'),
(85, 'department', 2, 'opened', 'Evaluation Opened', 'An evaluation has been opened in your department', '{\"evaluation_id\":62,\"course_id\":34,\"teacher_id\":20,\"academic_year\":\"2026\",\"semester\":\"Semester II\",\"year_level\":4}', 'info', '2026-02-23 01:12:21', NULL, '2026-02-22 03:48:23', '2026-02-23 01:12:21');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peer_evaluations`
--

CREATE TABLE `peer_evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `academic_year` varchar(255) NOT NULL,
  `semester` varchar(255) NOT NULL,
  `opened_at` date NOT NULL,
  `closed_at` date DEFAULT NULL,
  `template_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `peer_evaluations`
--

INSERT INTO `peer_evaluations` (`id`, `department_id`, `teacher_id`, `academic_year`, `semester`, `opened_at`, `closed_at`, `template_id`, `status`, `created_at`, `updated_at`) VALUES
(2, 2, 2, '2026', 'Semester I', '2026-02-04', NULL, 1, 'open', '2026-02-05 02:09:54', '2026-02-05 02:09:54'),
(3, 2, 3, '2026', 'Semester I', '2026-02-04', NULL, 1, 'open', '2026-02-05 02:45:09', '2026-02-05 02:45:09'),
(4, 2, 4, '2026', 'Semester I', '2026-02-11', NULL, 1, 'open', '2026-02-12 15:13:24', '2026-02-12 15:13:24'),
(5, 2, 5, '2026', 'Semester I', '2026-02-21', NULL, 1, 'open', '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(6, 2, 20, '2026', 'Semester II', '2026-02-21', NULL, 1, 'open', '2026-02-22 03:48:21', '2026-02-22 03:48:21');

-- --------------------------------------------------------

--
-- Table structure for table `peer_evaluation_assignees`
--

CREATE TABLE `peer_evaluation_assignees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `peer_evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `evaluator_teacher_id` bigint(20) UNSIGNED NOT NULL,
  `invited_at` timestamp NULL DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `peer_evaluation_assignees`
--

INSERT INTO `peer_evaluation_assignees` (`id`, `peer_evaluation_id`, `evaluator_teacher_id`, `invited_at`, `responded_at`, `status`, `created_at`, `updated_at`) VALUES
(3, 3, 2, '2026-02-05 02:45:09', '2026-02-20 03:31:08', 'completed', '2026-02-05 02:45:09', '2026-02-20 03:31:08'),
(5, 4, 2, '2026-02-12 15:13:24', '2026-02-21 20:15:29', 'completed', '2026-02-12 15:13:24', '2026-02-21 20:15:29'),
(6, 4, 3, '2026-02-12 15:13:24', '2026-02-20 03:36:44', 'completed', '2026-02-12 15:13:24', '2026-02-20 03:36:44'),
(7, 3, 4, '2026-02-20 04:43:53', NULL, 'pending', '2026-02-20 04:43:53', '2026-02-20 04:43:53'),
(8, 5, 2, '2026-02-21 19:20:16', '2026-02-21 19:24:39', 'completed', '2026-02-21 19:20:16', '2026-02-21 19:24:39'),
(9, 5, 3, '2026-02-21 19:20:16', NULL, 'pending', '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(10, 5, 4, '2026-02-21 19:20:16', NULL, 'pending', '2026-02-21 19:20:16', '2026-02-21 19:20:16'),
(11, 6, 2, '2026-02-22 03:48:21', '2026-02-22 03:50:50', 'completed', '2026-02-22 03:48:21', '2026-02-22 03:50:50'),
(12, 6, 3, '2026-02-22 03:48:21', NULL, 'pending', '2026-02-22 03:48:21', '2026-02-22 03:48:21'),
(13, 6, 4, '2026-02-22 03:48:21', NULL, 'pending', '2026-02-22 03:48:21', '2026-02-22 03:48:21'),
(14, 6, 5, '2026-02-22 03:48:21', NULL, 'pending', '2026-02-22 03:48:21', '2026-02-22 03:48:21');

-- --------------------------------------------------------

--
-- Table structure for table `peer_evaluation_responses`
--

CREATE TABLE `peer_evaluation_responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `peer_evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `evaluator_teacher_id` bigint(20) UNSIGNED NOT NULL,
  `responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`responses`)),
  `score` decimal(5,2) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `peer_evaluation_responses`
--

INSERT INTO `peer_evaluation_responses` (`id`, `peer_evaluation_id`, `evaluator_teacher_id`, `responses`, `score`, `submitted_at`, `created_at`, `updated_at`) VALUES
(4, 3, 2, '[{\"question_id\":1,\"rating\":5,\"text\":null},{\"question_id\":2,\"rating\":5,\"text\":null},{\"question_id\":3,\"rating\":4,\"text\":null},{\"question_id\":4,\"rating\":5,\"text\":null},{\"question_id\":5,\"rating\":5,\"text\":null},{\"question_id\":6,\"rating\":5,\"text\":null},{\"question_id\":7,\"rating\":5,\"text\":null},{\"question_id\":8,\"rating\":5,\"text\":null},{\"question_id\":9,\"rating\":5,\"text\":null},{\"question_id\":10,\"rating\":5,\"text\":null},{\"question_id\":11,\"rating\":5,\"text\":null},{\"question_id\":12,\"rating\":5,\"text\":null},{\"question_id\":13,\"rating\":5,\"text\":null},{\"question_id\":14,\"rating\":5,\"text\":null},{\"question_id\":15,\"rating\":5,\"text\":null},{\"question_id\":16,\"rating\":5,\"text\":null},{\"question_id\":17,\"rating\":5,\"text\":null},{\"question_id\":18,\"rating\":5,\"text\":null},{\"question_id\":19,\"rating\":5,\"text\":null},{\"question_id\":20,\"rating\":5,\"text\":null},{\"question_id\":21,\"rating\":5,\"text\":null},{\"question_id\":22,\"rating\":5,\"text\":null},{\"question_id\":23,\"rating\":4,\"text\":null},{\"question_id\":24,\"rating\":4,\"text\":null},{\"question_id\":25,\"rating\":4,\"text\":null},{\"question_id\":26,\"rating\":4,\"text\":null},{\"question_id\":27,\"rating\":4,\"text\":null},{\"question_id\":28,\"rating\":4,\"text\":null},{\"question_id\":29,\"rating\":4,\"text\":null}]', 94.48, '2026-02-20 03:31:08', '2026-02-20 03:31:08', '2026-02-20 03:31:08'),
(5, 4, 3, '[{\"question_id\":1,\"rating\":5,\"text\":null},{\"question_id\":2,\"rating\":1,\"text\":null},{\"question_id\":3,\"rating\":1,\"text\":null},{\"question_id\":4,\"rating\":2,\"text\":null},{\"question_id\":5,\"rating\":2,\"text\":null},{\"question_id\":6,\"rating\":2,\"text\":null},{\"question_id\":7,\"rating\":2,\"text\":null},{\"question_id\":8,\"rating\":3,\"text\":null},{\"question_id\":9,\"rating\":3,\"text\":null},{\"question_id\":10,\"rating\":3,\"text\":null},{\"question_id\":11,\"rating\":3,\"text\":null},{\"question_id\":12,\"rating\":4,\"text\":null},{\"question_id\":13,\"rating\":3,\"text\":null},{\"question_id\":14,\"rating\":5,\"text\":null},{\"question_id\":15,\"rating\":5,\"text\":null},{\"question_id\":16,\"rating\":5,\"text\":null},{\"question_id\":17,\"rating\":5,\"text\":null},{\"question_id\":18,\"rating\":5,\"text\":null},{\"question_id\":19,\"rating\":5,\"text\":null},{\"question_id\":20,\"rating\":5,\"text\":null},{\"question_id\":21,\"rating\":4,\"text\":null},{\"question_id\":22,\"rating\":4,\"text\":null},{\"question_id\":23,\"rating\":5,\"text\":null},{\"question_id\":24,\"rating\":4,\"text\":null},{\"question_id\":25,\"rating\":4,\"text\":null},{\"question_id\":26,\"rating\":4,\"text\":null},{\"question_id\":27,\"rating\":4,\"text\":null},{\"question_id\":28,\"rating\":4,\"text\":null},{\"question_id\":29,\"rating\":4,\"text\":null}]', 73.10, '2026-02-20 03:36:44', '2026-02-20 03:36:44', '2026-02-20 03:36:44'),
(6, 5, 2, '[{\"question_id\":58,\"rating\":2,\"text\":null},{\"question_id\":59,\"rating\":2,\"text\":null},{\"question_id\":60,\"rating\":3,\"text\":null},{\"question_id\":61,\"rating\":3,\"text\":null},{\"question_id\":62,\"rating\":4,\"text\":null}]', 56.00, '2026-02-21 19:24:39', '2026-02-21 19:24:39', '2026-02-21 19:24:39'),
(7, 4, 2, '[{\"question_id\":58,\"rating\":2,\"text\":null},{\"question_id\":59,\"rating\":3,\"text\":null},{\"question_id\":60,\"rating\":3,\"text\":null},{\"question_id\":61,\"rating\":4,\"text\":null},{\"question_id\":62,\"rating\":4,\"text\":null}]', 64.00, '2026-02-21 20:15:29', '2026-02-21 20:15:29', '2026-02-21 20:15:29'),
(8, 6, 2, '[{\"question_id\":58,\"rating\":5,\"text\":null},{\"question_id\":59,\"rating\":5,\"text\":null},{\"question_id\":60,\"rating\":4,\"text\":null},{\"question_id\":61,\"rating\":3,\"text\":null},{\"question_id\":62,\"rating\":4,\"text\":null}]', 84.00, '2026-02-22 03:50:50', '2026-02-22 03:50:50', '2026-02-22 03:50:50');

-- --------------------------------------------------------

--
-- Table structure for table `peer_template_questions`
--

CREATE TABLE `peer_template_questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `template_id` bigint(20) UNSIGNED NOT NULL,
  `text` text NOT NULL,
  `type` enum('rating','text') NOT NULL DEFAULT 'rating',
  `section` varchar(10) DEFAULT NULL,
  `order` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `peer_template_questions`
--

INSERT INTO `peer_template_questions` (`id`, `template_id`, `text`, `type`, `section`, `order`, `created_at`, `updated_at`) VALUES
(58, 1, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'General', 1, '2026-02-20 04:11:20', '2026-02-20 04:11:20'),
(59, 1, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'General', 2, '2026-02-20 04:11:20', '2026-02-20 04:11:20'),
(60, 1, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'General', 3, '2026-02-20 04:11:20', '2026-02-20 04:11:20'),
(61, 1, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'General', 4, '2026-02-20 04:11:20', '2026-02-20 04:11:20'),
(62, 1, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'General', 5, '2026-02-20 04:11:20', '2026-02-20 04:11:20');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(18, 'App\\Models\\User', 5, 'auth_token', '2274cab2ef9d7183e87dbfb97cd0dadcdcc5aea0fc707e3d0ef489e9fb0ca122', '[\"*\"]', NULL, NULL, '2026-02-21 00:41:57', '2026-02-21 00:41:57'),
(45, 'App\\Models\\User', 2, 'auth_token', 'aa6095ddc78e776e90e424b2980f8b858880152264edcd9cde70170323974788', '[\"*\"]', NULL, NULL, '2026-02-22 02:11:37', '2026-02-22 02:11:37'),
(59, 'App\\Models\\User', 3, 'auth_token', 'b79601844aefe7d6bad492e7b3354e9023bb51a3bb1dfb36cef8c20ba7a20785', '[\"*\"]', '2026-02-23 01:14:32', NULL, '2026-02-22 03:54:48', '2026-02-23 01:14:32');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `text` varchar(255) NOT NULL,
  `type` enum('rating','text') NOT NULL,
  `section` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `text`, `type`, `section`, `created_at`, `updated_at`) VALUES
(1, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-05 01:43:29', '2026-02-05 01:43:29'),
(2, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-05 01:43:29', '2026-02-05 01:43:29'),
(3, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-05 01:43:29', '2026-02-05 01:43:29'),
(4, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-05 01:43:29', '2026-02-05 01:43:29'),
(5, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(6, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(7, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(8, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(9, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(10, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(11, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(12, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(13, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(14, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(15, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(16, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(17, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(18, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-05 01:43:30', '2026-02-05 01:43:30'),
(19, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(20, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(21, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(22, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(23, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(24, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(25, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(26, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(27, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(28, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-05 01:43:31', '2026-02-05 01:43:31'),
(29, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-05 01:43:32', '2026-02-05 01:43:32'),
(30, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-05 02:11:33', '2026-02-05 02:11:33'),
(31, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-05 02:11:33', '2026-02-05 02:11:33'),
(32, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-05 02:11:33', '2026-02-05 02:11:33'),
(33, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-05 02:11:33', '2026-02-05 02:11:33'),
(34, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-05 02:11:33', '2026-02-05 02:11:33'),
(35, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-05 02:11:33', '2026-02-05 02:11:33'),
(36, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(37, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(38, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(39, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(40, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(41, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(42, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(43, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(44, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(45, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(46, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(47, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(48, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(49, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(50, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(51, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(52, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(53, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-05 02:11:34', '2026-02-05 02:11:34'),
(54, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-05 02:11:35', '2026-02-05 02:11:35'),
(55, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-05 02:11:35', '2026-02-05 02:11:35'),
(56, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-05 02:11:35', '2026-02-05 02:11:35'),
(57, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-05 02:11:35', '2026-02-05 02:11:35'),
(58, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-05 02:11:35', '2026-02-05 02:11:35'),
(59, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-05 02:45:28', '2026-02-05 02:45:28'),
(60, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-05 02:45:28', '2026-02-05 02:45:28'),
(61, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-05 02:45:28', '2026-02-05 02:45:28'),
(62, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-05 02:45:28', '2026-02-05 02:45:28'),
(63, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-05 02:45:28', '2026-02-05 02:45:28'),
(64, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(65, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(66, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(67, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(68, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(69, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(70, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(71, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(72, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(73, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(74, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(75, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-05 02:45:29', '2026-02-05 02:45:29'),
(76, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(77, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(78, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(79, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(80, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(81, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(82, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(83, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(84, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(85, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-05 02:45:30', '2026-02-05 02:45:30'),
(86, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-05 02:45:31', '2026-02-05 02:45:31'),
(87, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-05 02:45:31', '2026-02-05 02:45:31'),
(88, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-12 15:14:12', '2026-02-12 15:14:12'),
(89, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-12 15:14:12', '2026-02-12 15:14:12'),
(90, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-12 15:14:12', '2026-02-12 15:14:12'),
(91, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-12 15:14:12', '2026-02-12 15:14:12'),
(92, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-12 15:14:12', '2026-02-12 15:14:12'),
(93, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(94, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(95, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(96, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(97, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(98, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(99, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(100, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(101, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(102, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(103, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(104, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(105, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(106, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-12 15:14:13', '2026-02-12 15:14:13'),
(107, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(108, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(109, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(110, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(111, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(112, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(113, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(114, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(115, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(116, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-12 15:14:14', '2026-02-12 15:14:14'),
(117, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(118, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(119, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(120, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(121, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(122, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(123, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-20 04:45:20', '2026-02-20 04:45:20'),
(124, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(125, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(126, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(127, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(128, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(129, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(130, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(131, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(132, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(133, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(134, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(135, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(136, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-20 04:45:21', '2026-02-20 04:45:21'),
(137, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(138, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(139, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(140, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(141, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(142, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(143, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(144, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(145, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-20 04:45:22', '2026-02-20 04:45:22'),
(146, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-21 19:21:29', '2026-02-21 19:21:29'),
(147, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(148, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(149, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(150, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(151, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(152, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(153, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-21 19:21:30', '2026-02-21 19:21:30'),
(154, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(155, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(156, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(157, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(158, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(159, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(160, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-21 19:21:31', '2026-02-21 19:21:31'),
(161, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(162, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(163, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(164, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(165, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(166, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(167, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-21 19:21:32', '2026-02-21 19:21:32'),
(168, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(169, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(170, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(171, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(172, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(173, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(174, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-21 19:21:33', '2026-02-21 19:21:33'),
(175, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(176, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(177, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(178, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(179, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(180, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(181, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(182, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-22 03:39:13', '2026-02-22 03:39:13'),
(183, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(184, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(185, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(186, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(187, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(188, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(189, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(190, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(191, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(192, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(193, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-22 03:39:14', '2026-02-22 03:39:14'),
(194, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(195, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(196, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(197, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(198, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(199, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(200, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(201, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(202, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(203, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-22 03:39:15', '2026-02-22 03:39:15'),
(204, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(205, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(206, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(207, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(208, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(209, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(210, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 'A', '2026-02-22 03:49:29', '2026-02-22 03:49:29'),
(211, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(212, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(213, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(214, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(215, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(216, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(217, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 'A', '2026-02-22 03:49:30', '2026-02-22 03:49:30'),
(218, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(219, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(220, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(221, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(222, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(223, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(224, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(225, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 'B', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(226, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 'C', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(227, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 'C', '2026-02-22 03:49:31', '2026-02-22 03:49:31'),
(228, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 'C', '2026-02-22 03:49:32', '2026-02-22 03:49:32'),
(229, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 'C', '2026-02-22 03:49:32', '2026-02-22 03:49:32'),
(230, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 'C', '2026-02-22 03:49:32', '2026-02-22 03:49:32'),
(231, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 'C', '2026-02-22 03:49:32', '2026-02-22 03:49:32'),
(232, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 'C', '2026-02-22 03:49:32', '2026-02-22 03:49:32');

-- --------------------------------------------------------

--
-- Table structure for table `responses`
--

CREATE TABLE `responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `feedback_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `text` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `responses`
--

INSERT INTO `responses` (`id`, `feedback_id`, `question_id`, `rating`, `text`, `created_at`, `updated_at`) VALUES
(22273, 129, 175, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22274, 129, 176, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22275, 129, 177, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22276, 129, 178, 3, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22277, 129, 179, 3, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22278, 129, 180, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22279, 129, 181, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22280, 129, 182, 3, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22281, 129, 183, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22282, 129, 184, 3, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22283, 129, 185, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22284, 129, 186, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22285, 129, 187, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22286, 129, 188, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22287, 129, 189, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22288, 129, 190, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22289, 129, 191, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22290, 129, 192, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22291, 129, 193, 3, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22292, 129, 194, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22293, 129, 195, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22294, 129, 196, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22295, 129, 197, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22296, 129, 198, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22297, 129, 199, 3, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22298, 129, 200, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22299, 129, 201, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22300, 129, 202, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22301, 129, 203, 4, NULL, '2026-02-22 03:39:49', '2026-02-22 03:39:49'),
(22302, 130, 204, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22303, 130, 205, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22304, 130, 206, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22305, 130, 207, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22306, 130, 208, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22307, 130, 209, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22308, 130, 210, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22309, 130, 211, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22310, 130, 212, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22311, 130, 213, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22312, 130, 214, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22313, 130, 215, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22314, 130, 216, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22315, 130, 217, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22316, 130, 218, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22317, 130, 219, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22318, 130, 220, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22319, 130, 221, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22320, 130, 222, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22321, 130, 223, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22322, 130, 224, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22323, 130, 225, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22324, 130, 226, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22325, 130, 227, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22326, 130, 228, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22327, 130, 229, 4, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22328, 130, 230, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22329, 130, 231, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16'),
(22330, 130, 232, 5, NULL, '2026-02-22 03:50:16', '2026-02-22 03:50:16');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `year_level` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `department_id`, `name`, `email`, `student_id`, `year_level`, `semester`, `created_at`, `updated_at`) VALUES
(2, 2, 'Leta Tsegaye', 'student_0688@students.local', '0688', 4, 2, '2026-02-05 01:41:28', '2026-02-22 03:47:58'),
(3, 2, 'Chala', 'student_0689@students.local', '0689', 3, 1, '2026-02-05 02:04:17', '2026-02-05 02:04:17'),
(4, 2, 'Fedhi', 'student_0619@students.local', '0619', 4, 1, '2026-02-12 15:04:25', '2026-02-21 19:19:49'),
(5, 4, 'Student 9719', 'student6935@example.com', '0001', 2, 1, '2026-02-22 01:56:23', '2026-02-22 01:56:23'),
(6, 2, 'Student 5673', 'student7417@example.com', '0002', 3, 2, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(7, 4, 'Student 1684', 'student3062@example.com', '0003', 1, 1, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(8, 3, 'Student 4249', 'student7950@example.com', '0004', 2, 2, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(9, 4, 'Student 2219', 'student8142@example.com', '0005', 3, 1, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(10, 4, 'Student 9557', 'student1423@example.com', '0006', 4, 2, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(11, 2, 'Student 9637', 'student3892@example.com', '0007', 3, 2, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(12, 4, 'Student 6386', 'student5032@example.com', '0008', 2, 2, '2026-02-22 01:56:24', '2026-02-22 01:56:24'),
(13, 4, 'Student 8251', 'student4532@example.com', '0009', 4, 1, '2026-02-22 01:56:25', '2026-02-22 01:56:25'),
(14, 4, 'Student 3258', 'student6594@example.com', '0010', 2, 1, '2026-02-22 01:56:25', '2026-02-22 01:56:25'),
(15, 2, 'Student 4236', 'student9289@example.com', '0011', 1, 2, '2026-02-22 01:56:25', '2026-02-22 01:56:25'),
(16, 4, 'Student 9934', 'student9446@example.com', '0012', 1, 2, '2026-02-22 01:56:25', '2026-02-22 01:56:25'),
(17, 3, 'Student 2453', 'student8627@example.com', '0013', 3, 1, '2026-02-22 01:56:25', '2026-02-22 01:56:25'),
(18, 4, 'Student 8933', 'student9589@example.com', '0014', 1, 1, '2026-02-22 01:56:25', '2026-02-22 01:56:25'),
(19, 4, 'Student 6273', 'student2734@example.com', '0015', 3, 1, '2026-02-22 01:56:26', '2026-02-22 01:56:26'),
(20, 2, 'Student 1002', 'student2889@example.com', '0016', 2, 2, '2026-02-22 01:56:26', '2026-02-22 01:56:26'),
(21, 2, 'Student 4132', 'student7719@example.com', '0017', 2, 2, '2026-02-22 01:56:26', '2026-02-22 01:56:26'),
(22, 4, 'Student 5116', 'student5508@example.com', '0018', 1, 1, '2026-02-22 01:56:26', '2026-02-22 01:56:26'),
(23, 4, 'Student 4929', 'student8355@example.com', '0019', 1, 1, '2026-02-22 01:56:26', '2026-02-22 01:56:26'),
(25, 4, 'Student 1158', 'student3322@example.com', '1129', 3, 1, '2026-02-22 01:56:27', '2026-02-22 01:56:27'),
(27, 3, 'Student 1379', 'student2840@example.com', 'STU14359', 3, 2, '2026-02-22 01:56:27', '2026-02-22 01:56:27'),
(28, 4, 'Student 2528', 'student5609@example.com', 'STU42120', 4, 1, '2026-02-22 01:56:27', '2026-02-22 01:56:27'),
(29, 3, 'Student 1237', 'student8283@example.com', 'STU55423', 3, 1, '2026-02-22 01:56:28', '2026-02-22 01:56:28'),
(30, 2, 'Student 1297', 'student7640@example.com', 'STU60420', 3, 2, '2026-02-22 01:56:28', '2026-02-22 01:56:28'),
(31, 2, 'Student 6646', 'student2986@example.com', 'STU76712', 3, 1, '2026-02-22 01:56:28', '2026-02-22 01:56:28'),
(32, 2, 'Student 9479', 'student8208@example.com', 'STU46524', 1, 1, '2026-02-22 01:56:28', '2026-02-22 01:56:28'),
(33, 3, 'Student 5084', 'student4650@example.com', 'STU48500', 1, 1, '2026-02-22 01:56:28', '2026-02-22 01:56:28'),
(34, 3, 'Student 1938', 'student6198@example.com', 'STU69035', 2, 1, '2026-02-22 01:56:28', '2026-02-22 01:56:28'),
(35, 2, 'Student 7503', 'student6249@example.com', 'STU93689', 3, 2, '2026-02-22 01:56:29', '2026-02-22 01:56:29'),
(36, 3, 'Student 6038', 'student8551@example.com', 'STU21002', 2, 1, '2026-02-22 01:56:29', '2026-02-22 01:56:29'),
(37, 3, 'Student 6110', 'student8821@example.com', 'STU10709', 1, 1, '2026-02-22 01:56:29', '2026-02-22 01:56:29'),
(38, 4, 'Student 3976', 'student1911@example.com', 'STU36368', 4, 2, '2026-02-22 01:56:29', '2026-02-22 01:56:29'),
(39, 3, 'Student 1431', 'student4409@example.com', 'STU49407', 3, 2, '2026-02-22 01:56:29', '2026-02-22 01:56:29'),
(40, 2, 'Student 9541', 'student4635@example.com', 'STU60991', 3, 1, '2026-02-22 01:56:29', '2026-02-22 01:56:29'),
(41, 2, 'Student 1731', 'student8646@example.com', 'STU94522', 3, 2, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(42, 2, 'Student 7511', 'student3853@example.com', 'STU46395', 1, 1, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(43, 3, 'Student 6303', 'student7313@example.com', 'STU81072', 4, 1, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(44, 2, 'Student 9280', 'student3149@example.com', 'STU42724', 3, 2, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(45, 4, 'Student 6762', 'student4047@example.com', 'STU43202', 1, 1, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(46, 4, 'Student 5560', 'student3862@example.com', 'STU88419', 3, 2, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(47, 4, 'Student 7028', 'student5879@example.com', 'STU17913', 1, 1, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(48, 2, 'Student 9796', 'student7620@example.com', 'STU71203', 4, 1, '2026-02-22 01:56:30', '2026-02-22 01:56:30'),
(49, 3, 'Student 4328', 'student1444@example.com', 'STU85362', 4, 2, '2026-02-22 01:56:31', '2026-02-22 01:56:31'),
(50, 3, 'Student 9833', 'student3645@example.com', 'STU44913', 3, 2, '2026-02-22 01:56:31', '2026-02-22 01:56:31'),
(51, 4, 'Student 9066', 'student9951@example.com', 'STU92629', 1, 2, '2026-02-22 01:56:31', '2026-02-22 01:56:31'),
(52, 2, 'Student 7664', 'student4544@example.com', 'STU61355', 1, 1, '2026-02-22 01:56:31', '2026-02-22 01:56:31'),
(53, 3, 'Student 8344', 'student3128@example.com', 'STU99127', 2, 2, '2026-02-22 01:56:32', '2026-02-22 01:56:32'),
(54, 2, 'Student 3147', 'student3503@example.com', 'STU64649', 1, 2, '2026-02-22 01:56:32', '2026-02-22 01:56:32');

-- --------------------------------------------------------

--
-- Table structure for table `student_evaluation_templates`
--

CREATE TABLE `student_evaluation_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Default Evaluation Template',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `form_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_info`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `audience` varchar(255) NOT NULL DEFAULT 'student'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_evaluation_templates`
--

INSERT INTO `student_evaluation_templates` (`id`, `department_id`, `name`, `description`, `is_active`, `form_info`, `created_at`, `updated_at`, `audience`) VALUES
(1, 2, 'Comprehensive Teacher Evaluation Template', 'Department evaluation template with comprehensive questions covering instructional skills, professional ethics, and assessment methods.', 1, '{\"university\":\"BULE-HORA UNIVERSITY\",\"formTitle\":\"Teachers\' Performance Evaluation Criteria To be filled by student\",\"year\":2026,\"semester\":\"First\"}', '2026-02-05 01:43:11', '2026-02-05 01:43:11', 'student');

-- --------------------------------------------------------

--
-- Table structure for table `student_template_questions`
--

CREATE TABLE `student_template_questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `template_id` bigint(20) UNSIGNED NOT NULL,
  `text` text NOT NULL,
  `type` enum('rating','text') NOT NULL DEFAULT 'rating',
  `order` int(11) NOT NULL DEFAULT 0,
  `section` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_template_questions`
--

INSERT INTO `student_template_questions` (`id`, `template_id`, `text`, `type`, `order`, `section`, `created_at`, `updated_at`) VALUES
(1, 1, 'Applies & respects day one class one. የመጀመሪያ ቀን ክፍል አንድ ይተገብራል እና ያከብራል።', 'rating', 1, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(2, 1, 'Prepares & gives clear course outline. ዝርዝር ኮርስ ዝርዝር ይዘጋጃል እና ይሰጣል።', 'rating', 2, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(3, 1, 'Offers the course based on the sequence & content indicated in course outline. በኮርስ ዝርዝር ውስጥ የተጠቀሰውን ቅደም ተከተል እና ይዘት መሰረት በማድረግ ኮርሱን ይሰጣል።', 'rating', 3, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(4, 1, 'Outline & explains clearly the objectives of the chapters & topics. የምዕራፎች እና ርዕሶች ዓላማዎች በግልጽ ይገልጻል።', 'rating', 4, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(5, 1, 'Presents the course clearly using instructional language. በማስተማሪያ ቋንቋ በመጠቀም ኮርሱን በግልጽ ያቀርባል።', 'rating', 5, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(6, 1, 'Has adequate knowledge about the course offered. ስለሚሰጠው ኮርስ በቂ እውቀት አለው።', 'rating', 6, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(7, 1, 'Gets prepared & comes to the class always for daily lesson. ዝግጅት አድርጎ ለዕለታዊ ትምህርት ሁልጊዜ ወደ ክፍል ይመጣል።', 'rating', 7, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(8, 1, 'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary. አስፈላጊ ሲሆን ተገቢ ምሳሌዎችን፣ ማብራሪያዎችን እና የእውነተኛ ህይወት ሁኔታዎችን በመጠቀም ኮርሱን በአጭሩ ያብራራል።', 'rating', 8, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(9, 1, 'Identifies & offers the course to the learners based on their understanding level. በተማሪዎች የመረዳት ደረጃ መሰረት ኮርሱን ይለያል እና ይሰጣል።', 'rating', 9, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(10, 1, 'Gives class works, homework, assignments, work sheets, review questions—etc and provides solutions and feedbacks on time. የክፍል ስራዎችን፣ የቤት ስራዎችን፣ ተግባራትን፣ የስራ ወረቀቶችን፣ የግምገማ ጥያቄዎችን—ወዘተ ይሰጣል እና በወቅቱ መፍትሄዎችን እና ግብረመልሶችን ይሰጣል።', 'rating', 10, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(11, 1, 'Teaches using appropriate instructional materials (teaching aids). ተገቢ የማስተማሪያ ቁሳቁሶችን (የማስተማሪያ መሳሪያዎች) በመጠቀም ያስተምራል።', 'rating', 11, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(12, 1, 'Provides handout as well as necessary lists of reference books. የእጅ ወረቀት እንዲሁም አስፈላጊ የማጣቀሻ መጽሐፍት ዝርዝር ይሰጣል።', 'rating', 12, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(13, 1, 'Has interest & motivation to teach. ለማስተማር ፍላጎት እና ተነሳሽነት አለው።', 'rating', 13, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(14, 1, 'Uses the class only for appropriate teaching & learning issues. ክፍሉን ለተገቢ የማስተማር እና የመማር ጉዳዮች ብቻ ይጠቀማል።', 'rating', 14, 'A', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(15, 1, 'Always comes to the class on time & compensates wasted class time regularly. ሁልጊዜ በሰዓቱ ወደ ክፍል ይመጣል እና የጠፋውን የክፍል ጊዜ በመደበኛነት ይካካል።', 'rating', 15, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(16, 1, 'Encourages the students to participate in the class and receives answers from & gives answers to students\' questions satisfactorily. ተማሪዎች በክፍል ውስጥ እንዲሳተፉ ያበረታታል እና ከተማሪዎች ጥያቄዎች መልስ ይቀበላል እና በአጥጋቢ ሁኔታ መልስ ይሰጣል።', 'rating', 16, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(17, 1, 'Always avails himself or herself & solves the academic problem of the students during consultation hours. በማማከር ሰዓታት ሁልጊዜ ራሱን ያቀርባል እና የተማሪዎችን አካዳሚያዊ ችግር ይፈታል።', 'rating', 17, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(18, 1, 'Treats students equally and fairly without any discrimination. ተማሪዎችን ያለምንም አድልዎ እኩል እና በፍትሃዊነት ይይዛል።', 'rating', 18, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(19, 1, 'Usually motivates and encourages students to learn. ብዙውን ጊዜ ተማሪዎችን እንዲማሩ ያነሳሳል እና ያበረታታል።', 'rating', 19, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(20, 1, 'Tries to foster climate of trust and respect in teaching and learning process. በማስተማር እና በመማር ሂደት ውስጥ የመተማመን እና የመከባበር ሁኔታ ለመፍጠር ይሞክራል።', 'rating', 20, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(21, 1, 'Encourages student to express their feelings. ተማሪዎች ስሜታቸውን እንዲገልጹ ያበረታታል።', 'rating', 21, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(22, 1, 'Good role model, honest & a person of integrity. ጥሩ አርአያ፣ ታማኝ እና ታማኝነት ያለው ሰው።', 'rating', 22, 'B', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(23, 1, 'Announces the methods & types of assessment used in the course in advance. በኮርሱ ውስጥ የሚጠቀሙትን የግምገማ ዘዴዎች እና ዓይነቶች ቀድሞ ያስታውቃል።', 'rating', 23, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(24, 1, 'Checks if students have understood the lesson by different mechanisms. ተማሪዎች ትምህርቱን መረዳታቸውን በተለያዩ ዘዴዎች ይፈትሻል።', 'rating', 24, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(25, 1, 'Using continuous assessment, assesses students with various methods. ቀጣይነት ያለው ግምገማ በመጠቀም ተማሪዎችን በተለያዩ ዘዴዎች ይገመግማል።', 'rating', 25, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(26, 1, 'Corrects the students\' assessments & gives feedbacks on time. የተማሪዎችን ግምገማዎች ያስተካክላል እና በወቅቱ ግብረመልስ ይሰጣል።', 'rating', 26, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(27, 1, 'Prepares exam questions from topics & portions covered. ከተሸፈኑ ርዕሶች እና ክፍሎች የፈተና ጥያቄዎችን ያዘጋጃል።', 'rating', 27, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(28, 1, 'Allocates sufficient time for each tests & exams. ለእያንዳንዱ ፈተናዎች እና ፈተናዎች በቂ ጊዜ ይመድባል።', 'rating', 28, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11'),
(29, 1, 'Identifies students who scored below satisfactory & helps them to improve their result. ከአጥጋቢ በታች ውጤት ያስመዘገቡ ተማሪዎችን ይለያል እና ውጤታቸውን እንዲያሻሽሉ ይረዳቸዋል።', 'rating', 29, 'C', '2026-02-05 01:43:11', '2026-02-05 01:43:11');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `department_id`, `name`, `email`, `title`, `photo_url`, `created_at`, `updated_at`) VALUES
(2, 2, 'Fedhi Fikadu', 'fedhi@gmail.com', 'Professor', '/storage/teacher_photos/mU4VeXwjzPwlVocjhhuUfWu73qbGVLdl78Lucy3L.webp', '2026-02-05 02:02:38', '2026-02-05 02:02:38'),
(3, 2, 'Tolera Mangistu', 'tole@gmail.com', 'Masters', '/storage/teacher_photos/exUFueqQ1Avl3N8fIBjzUHRr5tH8hKjuOHlLXA7K.webp', '2026-02-05 02:42:55', '2026-02-05 02:42:55'),
(4, 2, 'Eba Girma', 'eba@gmail.com', 'Masters', '/storage/teacher_photos/OeZ0HQmr6nbl7MhehLsijde87a3YFPM9IToYSayp.webp', '2026-02-12 15:12:41', '2026-02-12 15:12:42'),
(5, 2, 'Dr.Abel Tensay', 'abel@gmail.com', 'Professer', NULL, '2026-02-21 19:17:57', '2026-02-21 19:17:57'),
(20, 2, 'Dr.Isayas', 'iso@gmail.com', 'Professor', '/storage/teacher_photos/QcR2f3uAGkHE098zi5u9aYI6wWTNctkkt5Y0nn9r.webp', '2026-02-22 03:47:11', '2026-02-22 03:47:11');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'student',
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `role`, `department_id`, `student_id`, `teacher_id`) VALUES
(1, 'College Admin', 'admin@college.local', NULL, '$2y$10$kdHhGfPKE8C7aCEhMDO3vurbZB2qrdttpvxaYRkP1oZZoKLi8relS', NULL, '2026-02-05 01:37:55', '2026-02-05 01:37:55', 'college_admin', NULL, NULL, NULL),
(2, 'College Admin', 'collegeadmin@gmail.com', NULL, '$2y$10$HIuYdnQXGSL8JF.4Aiik6ORJyFypstJbo5Hbn1sHB1RtVJh7f1Fca', NULL, '2026-02-05 01:37:55', '2026-02-05 01:37:55', 'college_admin', NULL, NULL, NULL),
(3, 'Mihretu', 'adminse@gmail.com', NULL, '$2y$10$pwh4QXNEGsnK2RjG6YZiTOcEs.JBGjeQEmu1L/yMnLlNVRUmcHesm', NULL, '2026-02-05 01:38:58', '2026-02-05 01:38:58', 'department_admin', 2, NULL, NULL),
(5, 'Leta', 'student_0688@students.local', NULL, '$2y$10$Cu77pBTqShz2R899ABua4OJLqTF39IS3NjKyLhZaECn0.qmy1P90K', NULL, '2026-02-05 01:41:29', '2026-02-05 01:41:29', 'student', 2, 2, NULL),
(6, 'Fedhi Fikadu', 'fedhi@gmail.com', NULL, '$2y$10$yXWZ0WxTdvB6jE7C7qttUekpND.ensCVea6XhDGx9yzVLZa.8Pdae', NULL, '2026-02-05 02:02:38', '2026-02-05 02:02:38', 'teacher', 2, NULL, 2),
(7, 'Chala', 'student_0689@students.local', NULL, '$2y$10$SbBjjcKP3ETuTnkjvact1uPJf.xOBX1.1VuEqZWTe2neHlhRXgtK6', NULL, '2026-02-05 02:04:17', '2026-02-05 02:04:17', 'student', 2, 3, NULL),
(8, 'Tolera Mangistu', 'tole@gmail.com', NULL, '$2y$10$EqedNHnYJgRwpc0Wv5LglOH.a6TND0ws3ZqV.Rfv61LUgK21tRYNy', NULL, '2026-02-05 02:42:55', '2026-02-05 02:42:55', 'teacher', 2, NULL, 3),
(9, 'Fedhi', 'student_0619@students.local', NULL, '$2y$10$Vh5ODXGD9YNmsKRhbNbQU.sY09pWqeSDWjfK7.eigCwgLzJze2Si6', NULL, '2026-02-12 15:04:25', '2026-02-12 15:04:25', 'student', 2, 4, NULL),
(10, 'Eba Girma', 'eba@gmail.com', NULL, '$2y$10$SzRvrvQnjicHBY7ZuGMQvetB2racvPOVZ79uaNofwmfMVjM/J0mOC', NULL, '2026-02-12 15:12:42', '2026-02-12 15:12:42', 'teacher', 2, NULL, 4),
(11, 'Dr.Abel Tensay', 'abel@gmail.com', NULL, '$2y$10$p3W3EOkYovYG.gQewUzMquSsI3csmajrlE7wA3h.V5dU8GOUbvmJe', NULL, '2026-02-21 19:17:57', '2026-02-21 19:17:57', 'teacher', 2, NULL, 5),
(12, 'Leta', 'leta@gmail.com', NULL, '$2y$10$s79wqCkwoeuljJNJ6OMTn.Fh2wPJ8ndn5gewJ/n.CXTH2J/toJ0Mi', NULL, '2026-02-22 00:03:36', '2026-02-22 00:03:36', 'department_admin', 4, NULL, NULL),
(31, 'Student 8251', 'student4532@example.com', NULL, '$2y$10$4bTfEi3ZGPr43iV7vwbDNeHnNb0zdQ7uTOSH8R2xBZCZlFw10lKU6', NULL, '2026-02-22 01:56:25', '2026-02-22 01:56:25', 'student', 4, 13, NULL),
(32, 'Student 3258', 'student6594@example.com', NULL, '$2y$10$680J.iWMLhC//LmZ88oPbO1OHWFXVHt1SJp/sjG.0D.k5Ic6PP3Dy', NULL, '2026-02-22 01:56:25', '2026-02-22 01:56:25', 'student', 4, 14, NULL),
(33, 'Student 4236', 'student9289@example.com', NULL, '$2y$10$5v1JHGFI3OFnDDQuBxrahezED.mKauZR5cqRid7J5Ny78rd5iTsPS', NULL, '2026-02-22 01:56:25', '2026-02-22 01:56:25', 'student', 2, 15, NULL),
(34, 'Student 9934', 'student9446@example.com', NULL, '$2y$10$JYHh4/f9uq4JTuU4Ht4WM.E0F0r7Ucngjz3IQxpsSrxp5HTnelGda', NULL, '2026-02-22 01:56:25', '2026-02-22 01:56:25', 'student', 4, 16, NULL),
(35, 'Student 2453', 'student8627@example.com', NULL, '$2y$10$eqz2c.TrqlxRSOvmfBncLeXgwXn28TqT9zLVqoQaR2zF5dnDHwqwm', NULL, '2026-02-22 01:56:25', '2026-02-22 01:56:25', 'student', 3, 17, NULL),
(36, 'Student 8933', 'student9589@example.com', NULL, '$2y$10$ikNoMJifYU26AiRaTv1phORYcwPL4ixSNqBwTZY1nR/UvAGu8GY.y', NULL, '2026-02-22 01:56:26', '2026-02-22 01:56:26', 'student', 4, 18, NULL),
(37, 'Student 6273', 'student2734@example.com', NULL, '$2y$10$e2Bs4Lr2M1u1BC99D.p6F.0PCJfUtmNFrVDnF.b0a6UZG8p5ie8Bu', NULL, '2026-02-22 01:56:26', '2026-02-22 01:56:26', 'student', 4, 19, NULL),
(38, 'Student 1002', 'student2889@example.com', NULL, '$2y$10$isQLYiuKv4ozLIRUdMsHl.wE78OHGQ3tb1VrxYbK3jnqOIIwHSVim', NULL, '2026-02-22 01:56:26', '2026-02-22 01:56:26', 'student', 2, 20, NULL),
(39, 'Student 4132', 'student7719@example.com', NULL, '$2y$10$zT9I4urjLU7lx.13N.iQFuRIUGv477K3HEy/69C1svf4XWaWG0gj6', NULL, '2026-02-22 01:56:26', '2026-02-22 01:56:26', 'student', 2, 21, NULL),
(40, 'Student 5116', 'student5508@example.com', NULL, '$2y$10$xHmhhRpZJbn8wGX39vZXwO4yW063juOHN7eJpcvfLwjLeJ615bR4O', NULL, '2026-02-22 01:56:26', '2026-02-22 01:56:26', 'student', 4, 22, NULL),
(41, 'Student 4929', 'student8355@example.com', NULL, '$2y$10$qyalFohN.G4Cssnj8VAebOpK2Efo1lJ.ZBg6R1P1Of7.KGNyEYkey', NULL, '2026-02-22 01:56:27', '2026-02-22 01:56:27', 'student', 4, 23, NULL),
(43, 'Student 1158', 'student3322@example.com', NULL, '$2y$10$9ERPPIW4/h7svfVt/QtcF.37yfjh4JXceh3aC/BYsyN42t.Xw1vui', NULL, '2026-02-22 01:56:27', '2026-02-22 01:56:27', 'student', 4, 25, NULL),
(45, 'Student 1379', 'student2840@example.com', NULL, '$2y$10$eIaK9MeRLnwx8s6oY2AMcuuRuEiYcDOKLQko.LjTIj2W6hPAm7fHC', NULL, '2026-02-22 01:56:27', '2026-02-22 01:56:27', 'student', 3, 27, NULL),
(46, 'Student 2528', 'student5609@example.com', NULL, '$2y$10$AGokgxOwn30lv.g6fQC6EOw1cmpspxqM7MDFTydhgQWJ5cHdZ5biK', NULL, '2026-02-22 01:56:28', '2026-02-22 01:56:28', 'student', 4, 28, NULL),
(47, 'Student 1237', 'student8283@example.com', NULL, '$2y$10$j8glQgrENhXCnJY7IWf1e.wmP.eiGRSV/Yer3SjU5qDQvX9Hbp0ZK', NULL, '2026-02-22 01:56:28', '2026-02-22 01:56:28', 'student', 3, 29, NULL),
(48, 'Student 1297', 'student7640@example.com', NULL, '$2y$10$RrwkF95/3Gqy2xTYlM1Vb.Sn1JGqzJ3dd4GYJSfQ2Qk5/IL8rpUtu', NULL, '2026-02-22 01:56:28', '2026-02-22 01:56:28', 'student', 2, 30, NULL),
(49, 'Student 6646', 'student2986@example.com', NULL, '$2y$10$AzKbRuqY.7PP4YQZKqALBO.aH09YhRzQxZMQwHNXADNUA1H9QYTlW', NULL, '2026-02-22 01:56:28', '2026-02-22 01:56:28', 'student', 2, 31, NULL),
(50, 'Student 9479', 'student8208@example.com', NULL, '$2y$10$LYGskFsZJYOmlapIDZCTuO5o/fCIXsm/CCkhHlQuuHBVHiRtsZCkW', NULL, '2026-02-22 01:56:28', '2026-02-22 01:56:28', 'student', 2, 32, NULL),
(51, 'Student 5084', 'student4650@example.com', NULL, '$2y$10$pyZ2YCu3kUXEf3dfa5d2lu2v3j4.oBGnrX22WeezjU0wkAUc6UV76', NULL, '2026-02-22 01:56:28', '2026-02-22 01:56:28', 'student', 3, 33, NULL),
(52, 'Student 1938', 'student6198@example.com', NULL, '$2y$10$prOaCAkj.Mvher7Z0GAMIebsG4ad.H9eJh.KRcGmFzMWVsUE6qdhq', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 3, 34, NULL),
(53, 'Student 7503', 'student6249@example.com', NULL, '$2y$10$g8q3OS8bT59hdFH/TSpKeO2UvXNRJERb5.0cUHvw1wJbUjgIyJr9m', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 2, 35, NULL),
(54, 'Student 6038', 'student8551@example.com', NULL, '$2y$10$LNXHxlvAAI63Wopxs7cwTu5l/KFyVz6UtxxTz10tY6KtTL/1lTPGi', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 3, 36, NULL),
(55, 'Student 6110', 'student8821@example.com', NULL, '$2y$10$xe1DhnWFC9V2IRl6PxaOoepjQNZdQJmfnccdeX1u/CaIb3Mf0z.ZC', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 3, 37, NULL),
(56, 'Student 3976', 'student1911@example.com', NULL, '$2y$10$c//wJFa7ITxCdglTpZye3ehJNnXicX/VYoOBF4CxmfecodsMzNLJy', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 4, 38, NULL),
(57, 'Student 1431', 'student4409@example.com', NULL, '$2y$10$PLJ0RROcvVcEkhXFOXQc5OnSjTEuTagperJDEdWkb03IS1aZ9C2Jm', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 3, 39, NULL),
(58, 'Student 9541', 'student4635@example.com', NULL, '$2y$10$41FvYjHULZY1RnIYOoGuOue029MI.fWj27MO6P4kkdZVC09PHc2o.', NULL, '2026-02-22 01:56:29', '2026-02-22 01:56:29', 'student', 2, 40, NULL),
(59, 'Student 1731', 'student8646@example.com', NULL, '$2y$10$gegjqBwZ4.0o8wr3oFJ/i.f8KdCryqZG7VRqPxH81IDXaHgcVNOyW', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 2, 41, NULL),
(60, 'Student 7511', 'student3853@example.com', NULL, '$2y$10$Nb1mXoNnDAW6g4TQGDjy.u8gQomw.paq5RNrSwNJOigFKHGYUmde6', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 2, 42, NULL),
(61, 'Student 6303', 'student7313@example.com', NULL, '$2y$10$dT2lVXoh8RggTbqkEMt9xeXtRoFDlyzay9RQ1QOFW9Ab/7Fhsccua', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 3, 43, NULL),
(62, 'Student 9280', 'student3149@example.com', NULL, '$2y$10$mSWUCNiRbB4HIXFnB9BWku/OvsTPv1ymJ/Jqlzdr.tj8N34NAKtcS', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 2, 44, NULL),
(63, 'Student 6762', 'student4047@example.com', NULL, '$2y$10$.EdWWe8MY31ibMXUhs9zPuhAIqILF.C4J7ABGmYnaJ2rWliMTjygq', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 4, 45, NULL),
(64, 'Student 5560', 'student3862@example.com', NULL, '$2y$10$tMUnHhRUEMXUooyB6Mqmu.xMJFY51m44xnf1BSyTiUlNxZsFFj7ny', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 4, 46, NULL),
(65, 'Student 7028', 'student5879@example.com', NULL, '$2y$10$0YqeWJd/MUwawLeSTPHM5.6270opg2wrJGLRYEEG1DDWy39uOvvBi', NULL, '2026-02-22 01:56:30', '2026-02-22 01:56:30', 'student', 4, 47, NULL),
(66, 'Student 9796', 'student7620@example.com', NULL, '$2y$10$MWSI7UNyABqbZEaHah9jGumQtJzP0wEY5A0PWpx3Vi5DCnPjW5/BO', NULL, '2026-02-22 01:56:31', '2026-02-22 01:56:31', 'student', 2, 48, NULL),
(67, 'Student 4328', 'student1444@example.com', NULL, '$2y$10$/fZ2SzR5ubIRWqIpsXHUFe98v/6yUOqDKFhEoWtbz93MhIY3SLhQ.', NULL, '2026-02-22 01:56:31', '2026-02-22 01:56:31', 'student', 3, 49, NULL),
(68, 'Student 9833', 'student3645@example.com', NULL, '$2y$10$jZ0/XydQ2nze03sVev241uMS4BlK.3Z9V3uCuCgBCFqSX/faITE7y', NULL, '2026-02-22 01:56:31', '2026-02-22 01:56:31', 'student', 3, 50, NULL),
(69, 'Student 9066', 'student9951@example.com', NULL, '$2y$10$guwChR/wdDFATBjnbGVv9.U6BObJhhQz6uibtXd534W4tg3Ip5vhC', NULL, '2026-02-22 01:56:31', '2026-02-22 01:56:31', 'student', 4, 51, NULL),
(70, 'Student 7664', 'student4544@example.com', NULL, '$2y$10$1QS08GFkLb8j2JRg6YJytO2hf8krDfRfjmtn/rilusdmzvPFkrOU.', NULL, '2026-02-22 01:56:31', '2026-02-22 01:56:31', 'student', 2, 52, NULL),
(71, 'Student 8344', 'student3128@example.com', NULL, '$2y$10$1NZ5T8gk7UKNLMfAvHKSUeHDXznvUHc.xe9HwW929WWMV7F9MwJAq', NULL, '2026-02-22 01:56:32', '2026-02-22 01:56:32', 'student', 3, 53, NULL),
(72, 'Student 3147', 'student3503@example.com', NULL, '$2y$10$Jxt/BMvukCLxcbFxi63jMOCqbUB6zD6glf4rVN7KILP1Esmh4VkVy', NULL, '2026-02-22 01:56:32', '2026-02-22 01:56:32', 'student', 2, 54, NULL),
(77, 'Dr.Isayas', 'iso@gmail.com', NULL, '$2y$10$.tvWizN34Zzb4SgKEOtX..h5qLrp5xfjeaelgQ1H8WrNGh.udgn8e', NULL, '2026-02-22 03:47:12', '2026-02-22 03:47:12', 'teacher', 2, NULL, 20);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_logs` (`user_id`,`user_type`),
  ADD KEY `idx_resource_logs` (`resource_type`,`resource_id`),
  ADD KEY `idx_action_logs` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `courses_code_unique` (`code`),
  ADD KEY `courses_department_id_foreign` (`department_id`);

--
-- Indexes for table `course_student_enrollments`
--
ALTER TABLE `course_student_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_student_enrollments_course_id_foreign` (`course_id`),
  ADD KEY `course_student_enrollments_student_id_foreign` (`student_id`);

--
-- Indexes for table `course_teacher`
--
ALTER TABLE `course_teacher`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_teacher_course_id_foreign` (`course_id`),
  ADD KEY `course_teacher_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_code_unique` (`code`);

--
-- Indexes for table `department_comments`
--
ALTER TABLE `department_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_comments_student_id_foreign` (`student_id`),
  ADD KEY `department_comments_teacher_id_foreign` (`teacher_id`),
  ADD KEY `department_comments_course_id_foreign` (`course_id`),
  ADD KEY `department_comments_department_id_teacher_id_course_id_index` (`department_id`,`teacher_id`,`course_id`);

--
-- Indexes for table `department_hod_evaluation_templates`
--
ALTER TABLE `department_hod_evaluation_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_hod_evaluation_templates_department_id_foreign` (`department_id`);

--
-- Indexes for table `department_peer_evaluation_templates`
--
ALTER TABLE `department_peer_evaluation_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_peer_evaluation_templates_department_id_foreign` (`department_id`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluations_course_id_foreign` (`course_id`),
  ADD KEY `evaluations_teacher_id_foreign` (`teacher_id`),
  ADD KEY `evaluations_department_id_foreign` (`department_id`),
  ADD KEY `evaluations_last_modified_by_foreign` (`last_modified_by`),
  ADD KEY `evaluations_last_modified_at_index` (`last_modified_at`);

--
-- Indexes for table `evaluation_analytics`
--
ALTER TABLE `evaluation_analytics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_evaluation_analytics` (`evaluation_id`);

--
-- Indexes for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_questions_evaluation_id_foreign` (`evaluation_id`),
  ADD KEY `evaluation_questions_question_id_foreign` (`question_id`);

--
-- Indexes for table `evaluation_submissions`
--
ALTER TABLE `evaluation_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_submission` (`evaluation_id`,`student_id`),
  ADD KEY `idx_evaluation_submissions` (`evaluation_id`),
  ADD KEY `idx_student_submissions` (`student_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feedbacks_evaluation_id_foreign` (`evaluation_id`),
  ADD KEY `feedbacks_student_id_foreign` (`student_id`),
  ADD KEY `idx_submission_id` (`submission_id`);

--
-- Indexes for table `hod_evaluations`
--
ALTER TABLE `hod_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_hod_eval_teacher_semester` (`department_id`,`teacher_id`,`academic_year`,`semester`),
  ADD KEY `hod_evaluations_teacher_id_foreign` (`teacher_id`),
  ADD KEY `idx_hod_eval_semester` (`department_id`,`academic_year`,`semester`);

--
-- Indexes for table `hod_evaluation_responses`
--
ALTER TABLE `hod_evaluation_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hod_eval_resp_unique` (`hod_evaluation_id`,`hod_template_question_id`),
  ADD KEY `hod_evaluation_responses_hod_template_question_id_foreign` (`hod_template_question_id`);

--
-- Indexes for table `hod_template_questions`
--
ALTER TABLE `hod_template_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hod_template_questions_template_id_foreign` (`template_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_recipient_type_recipient_id_read_at_index` (`recipient_type`,`recipient_id`,`read_at`),
  ADD KEY `notifications_type_priority_index` (`type`,`priority`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `peer_evaluations`
--
ALTER TABLE `peer_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_peer_eval_teacher_semester` (`department_id`,`teacher_id`,`academic_year`,`semester`),
  ADD KEY `peer_evaluations_teacher_id_foreign` (`teacher_id`),
  ADD KEY `idx_peer_eval_semester` (`department_id`,`academic_year`,`semester`);

--
-- Indexes for table `peer_evaluation_assignees`
--
ALTER TABLE `peer_evaluation_assignees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_peer_assignment` (`peer_evaluation_id`,`evaluator_teacher_id`),
  ADD KEY `idx_peer_assignee_status` (`evaluator_teacher_id`,`status`);

--
-- Indexes for table `peer_evaluation_responses`
--
ALTER TABLE `peer_evaluation_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_peer_response_once` (`peer_evaluation_id`,`evaluator_teacher_id`),
  ADD KEY `peer_evaluation_responses_evaluator_teacher_id_foreign` (`evaluator_teacher_id`),
  ADD KEY `idx_peer_eval_resp_eval` (`peer_evaluation_id`);

--
-- Indexes for table `peer_template_questions`
--
ALTER TABLE `peer_template_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `peer_template_questions_template_id_foreign` (`template_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `responses`
--
ALTER TABLE `responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `responses_feedback_id_foreign` (`feedback_id`),
  ADD KEY `responses_question_id_foreign` (`question_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_email_unique` (`email`),
  ADD UNIQUE KEY `students_student_id_unique` (`student_id`),
  ADD KEY `students_department_id_foreign` (`department_id`);

--
-- Indexes for table `student_evaluation_templates`
--
ALTER TABLE `student_evaluation_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_evaluation_templates_department_id_is_active_index` (`department_id`,`is_active`),
  ADD KEY `department_evaluation_templates_audience_index` (`audience`);

--
-- Indexes for table `student_template_questions`
--
ALTER TABLE `student_template_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `template_questions_template_id_order_index` (`template_id`,`order`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teachers_email_unique` (`email`),
  ADD KEY `teachers_department_id_foreign` (`department_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_department_id_foreign` (`department_id`),
  ADD KEY `users_student_id_foreign` (`student_id`),
  ADD KEY `users_teacher_id_foreign` (`teacher_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=214;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `course_student_enrollments`
--
ALTER TABLE `course_student_enrollments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_teacher`
--
ALTER TABLE `course_teacher`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `department_comments`
--
ALTER TABLE `department_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `department_hod_evaluation_templates`
--
ALTER TABLE `department_hod_evaluation_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `department_peer_evaluation_templates`
--
ALTER TABLE `department_peer_evaluation_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `evaluation_analytics`
--
ALTER TABLE `evaluation_analytics`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22679;

--
-- AUTO_INCREMENT for table `evaluation_submissions`
--
ALTER TABLE `evaluation_submissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT for table `hod_evaluations`
--
ALTER TABLE `hod_evaluations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `hod_evaluation_responses`
--
ALTER TABLE `hod_evaluation_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT for table `hod_template_questions`
--
ALTER TABLE `hod_template_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `peer_evaluations`
--
ALTER TABLE `peer_evaluations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `peer_evaluation_assignees`
--
ALTER TABLE `peer_evaluation_assignees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `peer_evaluation_responses`
--
ALTER TABLE `peer_evaluation_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `peer_template_questions`
--
ALTER TABLE `peer_template_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=233;

--
-- AUTO_INCREMENT for table `responses`
--
ALTER TABLE `responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22331;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `student_evaluation_templates`
--
ALTER TABLE `student_evaluation_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student_template_questions`
--
ALTER TABLE `student_template_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_student_enrollments`
--
ALTER TABLE `course_student_enrollments`
  ADD CONSTRAINT `course_student_enrollments_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_student_enrollments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_teacher`
--
ALTER TABLE `course_teacher`
  ADD CONSTRAINT `course_teacher_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_teacher_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `department_comments`
--
ALTER TABLE `department_comments`
  ADD CONSTRAINT `department_comments_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `department_comments_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `department_comments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `department_comments_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `department_hod_evaluation_templates`
--
ALTER TABLE `department_hod_evaluation_templates`
  ADD CONSTRAINT `department_hod_evaluation_templates_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `department_peer_evaluation_templates`
--
ALTER TABLE `department_peer_evaluation_templates`
  ADD CONSTRAINT `department_peer_evaluation_templates_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluations_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluations_last_modified_by_foreign` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `evaluations_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_analytics`
--
ALTER TABLE `evaluation_analytics`
  ADD CONSTRAINT `evaluation_analytics_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_questions`
--
ALTER TABLE `evaluation_questions`
  ADD CONSTRAINT `evaluation_questions_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_questions_question_id_foreign` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_submissions`
--
ALTER TABLE `evaluation_submissions`
  ADD CONSTRAINT `evaluation_submissions_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_submissions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `feedbacks_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedbacks_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `feedbacks_submission_id_foreign` FOREIGN KEY (`submission_id`) REFERENCES `evaluation_submissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hod_evaluations`
--
ALTER TABLE `hod_evaluations`
  ADD CONSTRAINT `hod_evaluations_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hod_evaluations_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hod_evaluation_responses`
--
ALTER TABLE `hod_evaluation_responses`
  ADD CONSTRAINT `hod_evaluation_responses_hod_evaluation_id_foreign` FOREIGN KEY (`hod_evaluation_id`) REFERENCES `hod_evaluations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hod_evaluation_responses_hod_template_question_id_foreign` FOREIGN KEY (`hod_template_question_id`) REFERENCES `hod_template_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hod_template_questions`
--
ALTER TABLE `hod_template_questions`
  ADD CONSTRAINT `hod_template_questions_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `department_hod_evaluation_templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `peer_evaluations`
--
ALTER TABLE `peer_evaluations`
  ADD CONSTRAINT `peer_evaluations_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_evaluations_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `peer_evaluation_assignees`
--
ALTER TABLE `peer_evaluation_assignees`
  ADD CONSTRAINT `peer_evaluation_assignees_evaluator_teacher_id_foreign` FOREIGN KEY (`evaluator_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_evaluation_assignees_peer_evaluation_id_foreign` FOREIGN KEY (`peer_evaluation_id`) REFERENCES `peer_evaluations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `peer_evaluation_responses`
--
ALTER TABLE `peer_evaluation_responses`
  ADD CONSTRAINT `peer_evaluation_responses_evaluator_teacher_id_foreign` FOREIGN KEY (`evaluator_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peer_evaluation_responses_peer_evaluation_id_foreign` FOREIGN KEY (`peer_evaluation_id`) REFERENCES `peer_evaluations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `peer_template_questions`
--
ALTER TABLE `peer_template_questions`
  ADD CONSTRAINT `peer_template_questions_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `department_peer_evaluation_templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `responses`
--
ALTER TABLE `responses`
  ADD CONSTRAINT `responses_feedback_id_foreign` FOREIGN KEY (`feedback_id`) REFERENCES `feedbacks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `responses_question_id_foreign` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_evaluation_templates`
--
ALTER TABLE `student_evaluation_templates`
  ADD CONSTRAINT `department_evaluation_templates_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_template_questions`
--
ALTER TABLE `student_template_questions`
  ADD CONSTRAINT `student_template_questions_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `student_evaluation_templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `teachers_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
