import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Currency } from "./Currency";
import { Event } from "./Event";
import { Guild } from "./Guild";
import { GuildCurrencyEmoji } from "./GuildCurrencyEmoji";

@Index("guild_currency_guild_FK", ["guildId"], {})
@Index("guild_currency_currency_FK", ["currencyId"], {})
@Index("guild_currency_event_FK", ["eventId"], {})
@Entity("guild_currency", { schema: "Tavare" })
export class GuildCurrency {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "guild_id", precision: 22 })
  guildId: number;

  @Column("int", { name: "currency_id", nullable: true, unsigned: true })
  currencyId: number | null;

  @Column("bigint", {
    name: "spawn_on_1_out_of_X_messages",
    nullable: true,
    unsigned: true,
    default: () => "'0'",
  })
  spawnOn_1OutOfXMessages: string | null;

  @Column("varchar", { name: "icon_emoji", length: 100 })
  iconEmoji: string;

  @Column("tinyint", { name: "is_primary", nullable: true, width: 1 })
  isPrimary: boolean | null;

  @Column("int", { name: "event_id", nullable: true, unsigned: true })
  eventId: number | null;

  @ManyToOne(() => Currency, (currency) => currency.guildCurrencies, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "currency_id", referencedColumnName: "id" }])
  currency: Currency;

  @ManyToOne(() => Event, (event) => event.guildCurrencies, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "event_id", referencedColumnName: "id" }])
  event: Event;

  @ManyToOne(() => Guild, (guild) => guild.guildCurrencies, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "guild_id", referencedColumnName: "id" }])
  guild: Guild;

  @OneToMany(
    () => GuildCurrencyEmoji,
    (guildCurrencyEmoji) => guildCurrencyEmoji.guildCurrency
  )
  guildCurrencyEmojis: GuildCurrencyEmoji[];
}
