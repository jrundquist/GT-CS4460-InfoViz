-- phpMyAdmin SQL Dump
-- version 3.3.7
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 23, 2011 at 03:38 PM
-- Server version: 5.1.41
-- PHP Version: 5.3.2-1ubuntu4.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `infoViz`
--
CREATE DATABASE `infoViz` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `infoViz`;

-- --------------------------------------------------------

--
-- Table structure for table `coordinates`
--

CREATE TABLE IF NOT EXISTS `coordinates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(6) CHARACTER SET latin1 NOT NULL,
  `x` double NOT NULL,
  `y` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=14 ;

-- --------------------------------------------------------

--
-- Table structure for table `hashtags`
--

CREATE TABLE IF NOT EXISTS `hashtags` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(140) CHARACTER SET latin1 NOT NULL,
  `start_index` int(11) NOT NULL,
  `end_index` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=396 ;

-- --------------------------------------------------------

--
-- Table structure for table `places`
--

CREATE TABLE IF NOT EXISTS `places` (
  `id` varchar(30) CHARACTER SET latin1 NOT NULL,
  `url` varchar(250) CHARACTER SET latin1 NOT NULL,
  `name` varchar(250) CHARACTER SET latin1 NOT NULL,
  `full_name` varchar(250) CHARACTER SET latin1 NOT NULL,
  `place_type` varchar(250) CHARACTER SET latin1 NOT NULL,
  `country_code` varchar(5) CHARACTER SET latin1 NOT NULL,
  `country` varchar(100) CHARACTER SET latin1 NOT NULL,
  `bb_x1` double NOT NULL,
  `bb_y1` double NOT NULL,
  `bb_x2` double NOT NULL,
  `bb_y2` double NOT NULL,
  `bb_x3` double NOT NULL,
  `bb_y3` double NOT NULL,
  `bb_x4` double NOT NULL,
  `bb_y4` double NOT NULL,
  `bb_type` varchar(100) CHARACTER SET latin1 NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tweet_hashtags`
--

CREATE TABLE IF NOT EXISTS `tweet_hashtags` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tweet_id` int(10) unsigned NOT NULL,
  `hashtag_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=396 ;

-- --------------------------------------------------------

--
-- Table structure for table `tweet_urls`
--

CREATE TABLE IF NOT EXISTS `tweet_urls` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tweet_id` int(10) unsigned NOT NULL,
  `url_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=317 ;

-- --------------------------------------------------------

--
-- Table structure for table `tweet_user_mentions`
--

CREATE TABLE IF NOT EXISTS `tweet_user_mentions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tweet_id` int(10) unsigned NOT NULL,
  `user_mention_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1404 ;

-- --------------------------------------------------------

--
-- Table structure for table `tweets`
--

CREATE TABLE IF NOT EXISTS `tweets` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `text` varchar(140) CHARACTER SET latin1 NOT NULL,
  `source` varchar(400) CHARACTER SET latin1 NOT NULL,
  `contributors` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  `coordinates_id` int(10) unsigned DEFAULT NULL,
  `geo_id` int(10) unsigned DEFAULT NULL,
  `place_id` varchar(16) COLLATE utf8_unicode_ci DEFAULT NULL,
  `in_reply_to_user_id` int(10) unsigned DEFAULT NULL,
  `in_reply_to_screen_name` varchar(16) CHARACTER SET latin1 DEFAULT NULL,
  `in_reply_to_status_id` int(10) unsigned DEFAULT NULL,
  `retweeted` tinyint(4) DEFAULT NULL,
  `retweet_count` int(11) DEFAULT NULL,
  `truncated` tinyint(4) NOT NULL,
  `favorited` tinyint(4) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `urls`
--

CREATE TABLE IF NOT EXISTS `urls` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `url` varchar(140) CHARACTER SET latin1 NOT NULL,
  `start_index` int(11) NOT NULL,
  `end_index` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=317 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_mentions`
--

CREATE TABLE IF NOT EXISTS `user_mentions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `screen_name` varchar(100) CHARACTER SET latin1 NOT NULL,
  `name` varchar(200) CHARACTER SET latin1 NOT NULL,
  `start_index` int(11) NOT NULL,
  `end_index` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1404 ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(20) unsigned NOT NULL,
  `screen_name` varchar(200) CHARACTER SET latin1 NOT NULL,
  `name` varchar(300) CHARACTER SET latin1 DEFAULT NULL,
  `url` varchar(300) CHARACTER SET latin1 DEFAULT NULL,
  `description` text CHARACTER SET latin1,
  `location` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  `notifications` tinyint(4) DEFAULT NULL,
  `followers_count` varchar(300) CHARACTER SET latin1 DEFAULT NULL,
  `statuses_count` int(11) unsigned DEFAULT NULL,
  `favourites_count` int(11) unsigned DEFAULT NULL,
  `friends_count` int(11) unsigned DEFAULT NULL,
  `time_zone` varchar(300) CHARACTER SET latin1 DEFAULT NULL,
  `utc_offset` int(11) DEFAULT NULL,
  `default_profile` tinyint(4) DEFAULT NULL,
  `profile_image_url` varchar(400) CHARACTER SET latin1 DEFAULT NULL,
  `profile_sidebar_border_color` varchar(6) CHARACTER SET latin1 DEFAULT NULL,
  `profile_link_color` varchar(6) CHARACTER SET latin1 DEFAULT NULL,
  `profile_text_color` varchar(6) CHARACTER SET latin1 DEFAULT NULL,
  `profile_sidebar_fill_color` varchar(6) CHARACTER SET latin1 DEFAULT NULL,
  `profile_background_color` varchar(6) CHARACTER SET latin1 DEFAULT NULL,
  `profile_background_tile` tinyint(4) DEFAULT NULL,
  `profile_use_background_image` tinyint(4) DEFAULT NULL,
  `profile_background_image_url` varchar(400) CHARACTER SET latin1 DEFAULT NULL,
  `default_profile_image` tinyint(4) DEFAULT NULL,
  `show_all_inline_media` tinyint(4) DEFAULT NULL,
  `lang` varchar(5) CHARACTER SET latin1 DEFAULT NULL,
  `contributors_enabled` tinyint(4) DEFAULT NULL,
  `geo_enabled` tinyint(4) DEFAULT NULL,
  `protected` tinyint(4) DEFAULT NULL,
  `following` tinyint(4) DEFAULT NULL,
  `verified` tinyint(4) DEFAULT NULL,
  `is_translator` tinyint(4) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `screen_name` (`screen_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
