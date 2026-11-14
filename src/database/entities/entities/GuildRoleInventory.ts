import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildRole } from "./GuildRole";
import { UserGuild } from "./UserGuild";

@Index("guild_role_inventory_guild_role_FK", ["grantedGuildRoleId"], {})
@Index("guild_role_inventory_date_expires_IDX", ["dateExpires"], {})
@Index(
  "guild_role_inventory_granted_by_guild_role_id_IDX",
  ["grantedByGuildRoleId"],
  {}
)
@Index(
  "guild_role_inventory_granted_by_user_guild_id_IDX",
  ["grantedByUserGuildId"],
  {}
)
@Entity("guild_role_inventory", { schema: "Tavare" })
export class GuildRoleInventory {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", {
    name: "granted_guild_role_id",
    comment: "the role granted by this entry",
    precision: 22,
  })
  grantedGuildRoleId: number;

  @Column("double", {
    name: "granted_by_guild_role_id",
    nullable: true,
    comment:
      "the role that grants this inventory item (MUST BE NULL IF granted_by_user_guild_id is filled)",
    precision: 22,
  })
  grantedByGuildRoleId: number | null;

  @Column("double", {
    name: "granted_by_user_guild_id",
    nullable: true,
    comment:
      "the user this role is being granted to. MUST BE NULL IF granted_by_guild_role_id IS FILLED",
    precision: 22,
  })
  grantedByUserGuildId: number | null;

  @Column("date", { name: "date_awarded", default: () => "CURRENT_TIMESTAMP" })
  dateAwarded: string;

  @Column("date", {
    name: "date_expires",
    nullable: true,
    comment: "If set, remove this entry after this date",
  })
  dateExpires: string | null;

  @Column("varchar", {
    name: "reason_for_award",
    comment: "The reason this was awarded",
    length: 100,
  })
  reasonForAward: string;

  @Column("tinyint", {
    name: "is_color",
    nullable: true,
    comment:
      "If this is a color role (and should be exclusive with all other color roles)",
    width: 1,
  })
  isColor: boolean | null;

  @Column("tinyint", {
    name: "can_gift",
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
  canGift: boolean | null;

  @ManyToOne(() => GuildRole, (guildRole) => guildRole.guildRoleInventories, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "granted_guild_role_id", referencedColumnName: "id" }])
  grantedGuildRole: GuildRole;

  @ManyToOne(() => GuildRole, (guildRole) => guildRole.guildRoleInventories2, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([
    { name: "granted_by_guild_role_id", referencedColumnName: "id" },
  ])
  grantedByGuildRole: GuildRole;

  @ManyToOne(() => UserGuild, (userGuild) => userGuild.guildRoleInventories, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([
    { name: "granted_by_user_guild_id", referencedColumnName: "id" },
  ])
  grantedByUserGuild: UserGuild;
}
