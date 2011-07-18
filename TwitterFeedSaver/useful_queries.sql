-- Useful twitter queries
-- 
-- James Rudquist


use `infoViz`;


-- Info about total tweets
select  (select count(`id`) from `tweets` where 1) as `tweets`, (select count(`id`) from `tweets` where `retweeted` = 1) as `retweets`, ((select count(`id`) from `tweets` where `retweeted` = 1)/(select count(`id`) from `tweets` where 1)) as `percent_retweets`;

-- Info about tweets per user
select  (select count(`id`) from `tweets` where 1) as `tweets`, (select count(`id`) from `users` where 1) as `users`, ((select count(`id`) from `tweets` where 1)/(select count(`id`) from `users` where 1)) as `tweets_per_user`;

-- User language breakdown
select `lang`, count(`lang`) as `total` from `users` where 1 group by `lang` order by count(`lang`) desc;