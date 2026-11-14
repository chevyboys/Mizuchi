import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildCurrency } from "./GuildCurrency";
import { UserGuild } from "./UserGuild";
import { GuildEvent } from "./GuildEvent";
import { Webhook } from "./Webhook";
import { GuildRole } from "./GuildRole";
import { Author } from "./Author";

@Index("guild_unique", ["snowflake"], { unique: true })
@Index("guild_unique_1", ["friendlyName"], { unique: true })
@Entity("guild", { schema: "Tavare" })
export class Guild {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("varchar", { name: "snowflake", unique: true, length: 100 })
  snowflake: string;

  @Column("tinyint", { name: "isTestGuild", width: 1, default: () => "'0'" })
  isTestGuild: boolean;

  @Column("varchar", { name: "friendly_name", unique: true, length: 100 })
  friendlyName: string;

  @OneToMany(() => GuildCurrency, (guildCurrency) => guildCurrency.guild)
  guildCurrencies: GuildCurrency[];

  @OneToMany(() => UserGuild, (userGuild) => userGuild.guild)
  userGuilds: UserGuild[];

  @OneToMany(() => GuildEvent, (guildEvent) => guildEvent.guild)
  guildEvents: GuildEvent[];

  @OneToMany(() => Webhook, (webhook) => webhook.guild)
  webhooks: Webhook[];

  @OneToMany(() => GuildRole, (guildRole) => guildRole.guild)
  guildRoles: GuildRole[];

  @OneToMany(() => Author, (author) => author.answerChannelGuild)
  authors: Author[];
}
