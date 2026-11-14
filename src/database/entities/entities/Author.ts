import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AuthorLink } from "./AuthorLink";
import { Guild } from "./Guild";
import { Users } from "./Users";

@Index("author_user", ["userId"], { unique: true })
@Index("author_unique", ["name"], { unique: true })
@Index("author_guild_FK", ["answerChannelGuildId"], {})
@Entity("author", { schema: "Tavare" })
export class Author {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "user_id", unique: true, precision: 22 })
  userId: number;

  @Column("varchar", {
    name: "name",
    nullable: true,
    unique: true,
    length: 256,
  })
  name: string | null;

  @Column("tinyint", { name: "active", width: 1, default: () => "'1'" })
  active: boolean;

  @Column("tinyint", { name: "blog_enabled", nullable: true, width: 1 })
  blogEnabled: boolean | null;

  @Column("varchar", { name: "rss_url", nullable: true, length: 256 })
  rssUrl: string | null;

  @Column("varchar", { name: "blog_post_webhook", nullable: true, length: 256 })
  blogPostWebhook: string | null;

  @Column("double", {
    name: "answer_channel_guild_id",
    nullable: true,
    precision: 22,
  })
  answerChannelGuildId: number | null;

  @Column("varchar", {
    name: "answer_channel_snowflake",
    nullable: true,
    length: 256,
  })
  answerChannelSnowflake: string | null;

  @Column("mediumint", {
    name: "answer_queue_notification_threshold",
    nullable: true,
    unsigned: true,
  })
  answerQueueNotificationThreshold: number | null;

  @Column("varchar", {
    name: "hex_color",
    nullable: true,
    length: 9,
    default: () => "'#1ed4c1'",
  })
  hexColor: string | null;

  @Column("varchar", { name: "image_url", nullable: true, length: 100 })
  imageUrl: string | null;

  @OneToMany(() => AuthorLink, (authorLink) => authorLink.author)
  authorLinks: AuthorLink[];

  @ManyToOne(() => Guild, (guild) => guild.authors, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "answer_channel_guild_id", referencedColumnName: "id" }])
  answerChannelGuild: Guild;

  @OneToOne(() => Users, (users) => users.author, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
