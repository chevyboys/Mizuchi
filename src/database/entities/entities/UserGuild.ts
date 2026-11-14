import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Guild } from "./Guild";
import { Users } from "./Users";
import { GuildRoleInventory } from "./GuildRoleInventory";

@Index("user_guild_unique", ["userId", "guildId"], { unique: true })
@Index("user_guild_guild_FK", ["guildId"], {})
@Index("user_guild_cakeday_IDX", ["cakeday"], {})
@Entity("user_guild", { schema: "Tavare" })
export class UserGuild {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "user_id", precision: 22 })
  userId: number;

  @Column("double", { name: "guild_id", precision: 22 })
  guildId: number;

  @Column("varchar", { name: "cakeday", nullable: true, length: 100 })
  cakeday: string | null;

  @Column("mediumint", { name: "cakeyear", nullable: true, unsigned: true })
  cakeyear: number | null;

  @ManyToOne(() => Guild, (guild) => guild.userGuilds, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "guild_id", referencedColumnName: "id" }])
  guild: Guild;

  @ManyToOne(() => Users, (users) => users.userGuilds, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Users;

  @OneToMany(
    () => GuildRoleInventory,
    (guildRoleInventory) => guildRoleInventory.grantedByUserGuild
  )
  guildRoleInventories: GuildRoleInventory[];
}
