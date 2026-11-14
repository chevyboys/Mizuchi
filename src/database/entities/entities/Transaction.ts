import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Currency } from "./Currency";
import { Users } from "./Users";

@Index("currencyid", ["currencyid"], {})
@Index("userid", ["userid"], {})
@Index("transaction_ibfk_3_idx", ["initatedbyuserid"], {})
@Entity("transaction", { schema: "Tavare" })
export class Transaction {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "currencyid", unsigned: true })
  currencyid: number;

  @Column("varchar", { name: "userid", nullable: true, length: 256 })
  userid: string | null;

  @Column("double", { name: "amount", precision: 22 })
  amount: number;

  @Column("datetime", {
    name: "timestamp",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  timestamp: Date | null;

  @Column("varchar", { name: "initatedbyuserid", nullable: true, length: 256 })
  initatedbyuserid: string | null;

  @Column("varchar", { name: "reason", nullable: true, length: 45 })
  reason: string | null;

  @ManyToOne(() => Currency, (currency) => currency.transactions, {
    onDelete: "CASCADE",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "currencyid", referencedColumnName: "id" }])
  currency: Currency;

  @ManyToOne(() => Users, (users) => users.transactions, {
    onDelete: "CASCADE",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "userid", referencedColumnName: "snowflake" }])
  user: Users;

  @ManyToOne(() => Users, (users) => users.transactions2, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "initatedbyuserid", referencedColumnName: "snowflake" }])
  initatedbyuser: Users;
}
