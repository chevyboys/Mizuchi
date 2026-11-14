import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildEventRoleMap } from "./GuildEventRoleMap";
import { GuildRoleInventory } from "./GuildRoleInventory";
import { UserGuildRole } from "./UserGuildRole";
import { Guild } from "./Guild";

@Index("guild_role_unique", ["snowflake"], { unique: true })
@Index("guild_role_guild_FK", ["guildId"], {})
@Index("guild_role_guild_role_FK", ["slaveRoleId"], {})
@Entity("guild_role", { schema: "Tavare" })
export class GuildRole {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "guild_id", precision: 22 })
  guildId: number;

  @Column("varchar", { name: "snowflake", unique: true, length: 100 })
  snowflake: string;

  @Column("tinyint", {
    name: "has_redacted_info",
    width: 1,
    default: () => "'0'",
  })
  hasRedactedInfo: boolean;

  @Column("tinyint", { name: "is_update_role", width: 1, default: () => "'0'" })
  isUpdateRole: boolean;

  @Column("varchar", { name: "friendly_name", length: 100 })
  friendlyName: string;

  @Column("double", { name: "slave_role_id", nullable: true, precision: 22 })
  slaveRoleId: number | null;

  @Column("tinyint", {
    name: "is_event_role",
    comment:
      "Turn to true to mark this as a role that can be selected by the event builder",
    width: 1,
    default: () => "'0'",
  })
  isEventRole: boolean;

  @OneToMany(
    () => GuildEventRoleMap,
    (guildEventRoleMap) => guildEventRoleMap.guildRole
  )
  guildEventRoleMaps: GuildEventRoleMap[];

  @OneToMany(
    () => GuildRoleInventory,
    (guildRoleInventory) => guildRoleInventory.grantedGuildRole
  )
  guildRoleInventories: GuildRoleInventory[];

  @OneToMany(
    () => GuildRoleInventory,
    (guildRoleInventory) => guildRoleInventory.grantedByGuildRole
  )
  guildRoleInventories2: GuildRoleInventory[];

  @OneToMany(() => UserGuildRole, (userGuildRole) => userGuildRole.guildRole)
  userGuildRoles: UserGuildRole[];

  @ManyToOne(() => Guild, (guild) => guild.guildRoles, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "guild_id", referencedColumnName: "id" }])
  guild: Guild;

  @ManyToOne(() => GuildRole, (guildRole) => guildRole.guildRoles, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "slave_role_id", referencedColumnName: "id" }])
  slaveRole: GuildRole;

  @OneToMany(() => GuildRole, (guildRole) => guildRole.slaveRole)
  guildRoles: GuildRole[];
}
