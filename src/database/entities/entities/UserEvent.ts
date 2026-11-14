import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Event } from "./Event";
import { Users } from "./Users";

@Index("user_event_multikey_IDX", ["userId", "eventId", "eventYear"], {
  unique: true,
})
@Index("user_event_user_id_IDX", ["userId"], {})
@Index("user_event_event_id_IDX", ["eventId"], {})
@Index("user_event_event_year_IDX", ["eventYear"], {})
@Entity("user_event", { schema: "Tavare" })
export class UserEvent {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("double", { name: "user_id", precision: 22 })
  userId: number;

  @Column("int", { name: "event_id", unsigned: true })
  eventId: number;

  @Column("longtext", { name: "event_data", nullable: true })
  eventData: string | null;

  @Column("int", {
    name: "event_year",
    unsigned: true,
    default: () => "'year(curdate())'",
  })
  eventYear: number;

  @ManyToOne(() => Event, (event) => event.userEvents, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "event_id", referencedColumnName: "id" }])
  event: Event;

  @ManyToOne(() => Users, (users) => users.userEvents, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
