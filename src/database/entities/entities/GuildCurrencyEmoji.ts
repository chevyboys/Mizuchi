import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildCurrency } from "./GuildCurrency";

@Index("guild_currency_emoji_guild_currency_FK", ["guildCurrencyId"], {})
@Entity("guild_currency_emoji", { schema: "Tavare" })
export class GuildCurrencyEmoji {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "guild_currency_id", precision: 22 })
  guildCurrencyId: number;

  @Column("bigint", { name: "currency_value", unsigned: true })
  currencyValue: string;

  @Column("varchar", { name: "emoji", length: 100 })
  emoji: string;

  @Column("varchar", { name: "color", nullable: true, length: 100 })
  color: string | null;

  @ManyToOne(
    () => GuildCurrency,
    (guildCurrency) => guildCurrency.guildCurrencyEmojis,
    { onDelete: "CASCADE", onUpdate: "CASCADE" }
  )
  @JoinColumn([{ name: "guild_currency_id", referencedColumnName: "id" }])
  guildCurrency: GuildCurrency;
}
