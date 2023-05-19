-- CreateTable
CREATE TABLE `Author` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(30) NOT NULL,
    `authorName` VARCHAR(60) NOT NULL,
    `authorHexColor` VARCHAR(7) NOT NULL,
    `blogApiUrl` TEXT NULL,
    `blogChannelId` VARCHAR(30) NULL,
    `imageUrl` TEXT NOT NULL,

    INDEX `FK_AuthorUserId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthorGuildRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `guildid` VARCHAR(30) NOT NULL,
    `authorId` BIGINT UNSIGNED NOT NULL,
    `answerChannelId` VARCHAR(30) NULL,
    `blogChannelId` VARCHAR(30) NULL,
    `blogEnabled` BOOLEAN NOT NULL DEFAULT false,

    INDEX `FK_AuthorGuildRelationship_AuthorId`(`authorId`),
    INDEX `FK_AuthorGuildRelationship_guildId`(`guildid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthorLinks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `authorId` BIGINT UNSIGNED NOT NULL,
    `label` VARCHAR(80) NOT NULL,
    `link` TEXT NOT NULL,

    INDEX `FK_AuthorLinks_Author`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmojiDuty` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `duty` VARCHAR(60) NOT NULL,
    `defaultEmoji` CHAR(1) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FAQCategory` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `guildId` VARCHAR(30) NOT NULL,
    `messageId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `expiration` TIMESTAMP(0) NULL,

    INDEX `FK_FAQCategory_GuildId`(`guildId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FAQQuestion` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `FAQCategoryId` BIGINT UNSIGNED NOT NULL,
    `question` VARCHAR(80) NOT NULL,
    `answer` TEXT NOT NULL,

    INDEX `FK_FAQQUESTION_QuestionCategory`(`FAQCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guild` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(32) NULL,
    `wikiLink` TEXT NULL,
    `welcomeString` TEXT NULL,
    `welcomeType` ENUM('prepend', 'embed', 'append', 'insert', 'override', 'disabled') NOT NULL DEFAULT 'disabled',
    `welcomeTitle` VARCHAR(500) NULL,
    `welcomeImage` TEXT NULL,
    `welcomeExpiration` TIMESTAMP(0) NULL,
    `questionQueueChannel` VARCHAR(30) NULL,
    `publicCommandsChannel` VARCHAR(30) NULL,
    `questionDiscussionChannel` VARCHAR(30) NULL,
    `adminCommandsChannel` VARCHAR(30) NULL,
    `faqChannel` VARCHAR(30) NULL,
    `generalChannel` VARCHAR(30) NULL,
    `introductionsChannel` VARCHAR(30) NULL,
    `modRequestsChannel` VARCHAR(30) NULL,
    `rolesChannel` VARCHAR(30) NULL,
    `rulesChannel` VARCHAR(30) NULL,
    `secretChannel` VARCHAR(30) NULL,
    `spoilerPolicyChannel` VARCHAR(30) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildEmoji` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `emojiDutyId` SMALLINT UNSIGNED NULL,
    `discordGuildid` VARCHAR(30) NOT NULL,
    `emoji` VARCHAR(100) NOT NULL,

    INDEX `FK_DiscordGuildEmoji_EmojiDutyId`(`emojiDutyId`),
    INDEX `FK_DiscordGuildEmoji_GuildId`(`discordGuildid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildLinks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `discordGuildid` VARCHAR(30) NOT NULL,
    `link` VARCHAR(1000) NOT NULL,
    `label` VARCHAR(80) NOT NULL,
    `isMeme` BOOLEAN NOT NULL DEFAULT false,

    INDEX `FK_GuildLinks_GuildId`(`discordGuildid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildRoleTypeRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `discordGuildId` VARCHAR(30) NOT NULL,
    `discordRoleId` VARCHAR(30) NOT NULL,
    `discordRoleDutyId` SMALLINT UNSIGNED NULL,
    `sensitiveData` BOOLEAN NULL,

    INDEX `FK_GuildRoleTypeRelationship_DutyId`(`discordRoleDutyId`),
    INDEX `FK_GuildRoleTypeRelationship_GuildId`(`discordGuildId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(30) NULL,
    `status` ENUM('Discarded', 'Answered', 'Queued', '') NOT NULL DEFAULT 'Queued',
    `questionText` TEXT NOT NULL,
    `answerText` TEXT NULL,
    `answererGuildAuthorId` BIGINT UNSIGNED NOT NULL,
    `timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionFlag` (
    `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionFlagRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `questionId` BIGINT UNSIGNED NOT NULL,
    `questionFlagId` TINYINT UNSIGNED NOT NULL,

    INDEX `FK_QuestionFlagRelationship_FlagId`(`questionFlagId`),
    INDEX `FK_QuestionFlagRelationship_QuestionId`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionUserRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `questionId` BIGINT UNSIGNED NOT NULL,
    `discordUserId` VARCHAR(30) NOT NULL,
    `questionUserRelationshipTypeId` TINYINT UNSIGNED NOT NULL,

    INDEX `FK_UserQuestionRelationshipQuestion`(`questionId`),
    INDEX `FK_UserQuestionRelationshipQuestionType`(`questionUserRelationshipTypeId`),
    INDEX `FK_UserQuestionRelationshipUser`(`discordUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionUserRelationshipType` (
    `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(60) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleDuty` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `friendlyName` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserGuildRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `discordUserId` VARCHAR(30) NOT NULL,
    `discordGuildId` VARCHAR(30) NOT NULL,
    `helperExpirationDate` TIMESTAMP(0) NULL,
    `cakeday` VARCHAR(10) NOT NULL,
    `currentXp` BIGINT UNSIGNED NOT NULL,
    `totalXp` BIGINT UNSIGNED NOT NULL,

    INDEX `fk_discordGuildId`(`discordGuildId`),
    INDEX `guildId userId`(`discordUserId`, `discordGuildId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserGuildRoleRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `discordUserId` VARCHAR(30) NOT NULL,
    `guildRoleRelationshipId` BIGINT UNSIGNED NOT NULL,

    INDEX `FK_UserGuildRoleRelationship_GuildRoleRelationshipId`(`guildRoleRelationshipId`),
    INDEX `FK_UserGuildRoleRelationship_UserId`(`discordUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feature` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `friendlyName` VARCHAR(90) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildFeatureRelationship` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `featureId` BIGINT UNSIGNED NOT NULL,
    `discordGuildId` VARCHAR(30) NOT NULL,

    INDEX `fk_discordGuildId`(`discordGuildId`),
    INDEX `guildId featureId`(`featureId`, `discordGuildId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Author` ADD CONSTRAINT `FK_AuthorUserId` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthorGuildRelationship` ADD CONSTRAINT `FK_AuthorGuildRelationship_AuthorId` FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `AuthorGuildRelationship` ADD CONSTRAINT `FK_AuthorGuildRelationship_guildId` FOREIGN KEY (`guildid`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `AuthorLinks` ADD CONSTRAINT `FK_AuthorLinks_Author` FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FAQCategory` ADD CONSTRAINT `FK_FAQCategory_GuildId` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `FAQQuestion` ADD CONSTRAINT `FK_FAQQUESTION_QuestionCategory` FOREIGN KEY (`FAQCategoryId`) REFERENCES `FAQCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildEmoji` ADD CONSTRAINT `FK_DiscordGuildEmoji_EmojiDutyId` FOREIGN KEY (`emojiDutyId`) REFERENCES `EmojiDuty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildEmoji` ADD CONSTRAINT `FK_DiscordGuildEmoji_GuildId` FOREIGN KEY (`discordGuildid`) REFERENCES `Guild`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildLinks` ADD CONSTRAINT `FK_GuildLinks_GuildId` FOREIGN KEY (`discordGuildid`) REFERENCES `Guild`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildRoleTypeRelationship` ADD CONSTRAINT `FK_GuildRoleTypeRelationship_DutyId` FOREIGN KEY (`discordRoleDutyId`) REFERENCES `RoleDuty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildRoleTypeRelationship` ADD CONSTRAINT `FK_GuildRoleTypeRelationship_GuildId` FOREIGN KEY (`discordGuildId`) REFERENCES `Guild`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_answererGuildAuthorId_fkey` FOREIGN KEY (`answererGuildAuthorId`) REFERENCES `AuthorGuildRelationship`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionFlagRelationship` ADD CONSTRAINT `FK_QuestionFlagRelationship_FlagId` FOREIGN KEY (`questionFlagId`) REFERENCES `QuestionFlag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionFlagRelationship` ADD CONSTRAINT `FK_QuestionFlagRelationship_QuestionId` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionUserRelationship` ADD CONSTRAINT `FK_UserQuestionRelationshipQuestion` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionUserRelationship` ADD CONSTRAINT `FK_UserQuestionRelationshipQuestionType` FOREIGN KEY (`questionUserRelationshipTypeId`) REFERENCES `QuestionUserRelationshipType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionUserRelationship` ADD CONSTRAINT `FK_UserQuestionRelationshipUser` FOREIGN KEY (`discordUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserGuildRelationship` ADD CONSTRAINT `fk_discordGuildId` FOREIGN KEY (`discordGuildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserGuildRelationship` ADD CONSTRAINT `fk_discordUserId` FOREIGN KEY (`discordUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserGuildRoleRelationship` ADD CONSTRAINT `FK_UserGuildRoleRelationship_GuildRoleRelationshipId` FOREIGN KEY (`guildRoleRelationshipId`) REFERENCES `GuildRoleTypeRelationship`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserGuildRoleRelationship` ADD CONSTRAINT `FK_UserGuildRoleRelationship_UserId` FOREIGN KEY (`discordUserId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildFeatureRelationship` ADD CONSTRAINT `fk_discordGuildId1` FOREIGN KEY (`discordGuildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildFeatureRelationship` ADD CONSTRAINT `fk_FeatureId` FOREIGN KEY (`featureId`) REFERENCES `Feature`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
