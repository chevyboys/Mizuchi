import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildEvent } from "./GuildEvent";
import { Guild } from "./Guild";

@Index("webhook_guild_FK", ["guildId"], {})
@Entity("webhook", { schema: "Tavare" })
export class Webhook {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("double", { name: "guild_id", precision: 22 })
  guildId: number;

  @Column("varchar", { name: "name", length: 100 })
  name: string;

  @Column("varchar", { name: "avatar", length: 512 })
  avatar: string;

  @Column("varchar", { name: "channel_snowflake", length: 100 })
  channelSnowflake: string;

  @OneToMany(() => GuildEvent, (guildEvent) => guildEvent.announcementWebhook)
  guildEvents: GuildEvent[];

  @ManyToOne(() => Guild, (guild) => guild.webhooks, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "guild_id", referencedColumnName: "id" }])
  guild: Guild;
}
