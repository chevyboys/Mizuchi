import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { GuildEventRoleMap } from "./GuildEventRoleMap";

@Entity("event_role_template", { schema: "Tavare" })
export class EventRoleTemplate {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("int", { name: "event_id", unsigned: true })
  eventId: number;

  @Column("varchar", { name: "name", length: 100 })
  name: string;

  @Column("char", {
    name: "color",
    nullable: true,
    comment: "Hex code of the new role color",
    length: 7,
  })
  color: string | null;

  @Column("char", {
    name: "gradient_secondary_color",
    nullable: true,
    length: 7,
  })
  gradientSecondaryColor: string | null;

  @Column("varchar", { name: "icon", nullable: true, length: 100 })
  icon: string | null;

  @OneToMany(
    () => GuildEventRoleMap,
    (guildEventRoleMap) => guildEventRoleMap.template
  )
  guildEventRoleMaps: GuildEventRoleMap[];
}
