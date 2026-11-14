import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildCurrency } from "./GuildCurrency";
import { Transaction } from "./Transaction";

@Index("id_UNIQUE", ["id"], { unique: true })
@Entity("currency", { schema: "Tavare" })
export class Currency {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "name", length: 45 })
  name: string;

  @Column("varchar", { name: "type", nullable: true, length: 45 })
  type: string | null;

  @Column("bit", { name: "active", default: () => "'b'1''" })
  active: boolean;

  @OneToMany(() => GuildCurrency, (guildCurrency) => guildCurrency.currency)
  guildCurrencies: GuildCurrency[];

  @OneToMany(() => Transaction, (transaction) => transaction.currency)
  transactions: Transaction[];
}
