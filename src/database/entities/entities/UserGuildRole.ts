import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GuildRole } from "./GuildRole";
import { Users } from "./Users";

@Index("user_guild_role_unique", ["userId", "guildRoleId"], { unique: true })
@Index("user_guild_role_guild_role_FK", ["guildRoleId"], {})
@Entity("user_guild_role", { schema: "Tavare" })
export class UserGuildRole {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "user_id", precision: 22 })
  userId: number;

  @Column("double", { name: "guild_role_id", precision: 22 })
  guildRoleId: number;

  @ManyToOne(() => GuildRole, (guildRole) => guildRole.userGuildRoles, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "guild_role_id", referencedColumnName: "id" }])
  guildRole: GuildRole;

  @ManyToOne(() => Users, (users) => users.userGuildRoles, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;
}
