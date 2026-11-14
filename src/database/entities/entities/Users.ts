import {Column,Entity,Index,OneToMany,OneToOne,PrimaryGeneratedColumn} from "typeorm";
import {UserGuild} from './UserGuild'
import {Transaction} from './Transaction'
import {UserEvent} from './UserEvent'
import {Character} from './Character'
import {UserGuildRole} from './UserGuildRole'
import {Author} from './Author'


@Index("userID_2",["snowflake",],{ unique:true })
@Index("userID",["snowflake",],{  })
@Index("username",["username",],{  })
@Entity("users" ,{schema:"Tavare" } )
export  class Users {

@Column("varchar",{ name:"snowflake",nullable:true,unique:true,length:256 })
snowflake:string | null;

@Column("varchar",{ name:"username",nullable:true,length:40 })
username:string | null;

@PrimaryGeneratedColumn({ type:"double", name:"id",precision:22 })
id:number;

@OneToMany(()=>UserGuild,userGuild=>userGuild.user)


userGuilds:UserGuild[];

@OneToMany(()=>Transaction,transaction=>transaction.user)


transactions:Transaction[];

@OneToMany(()=>Transaction,transaction=>transaction.initatedbyuser)


transactions2:Transaction[];

@OneToMany(()=>UserEvent,userEvent=>userEvent.user)


userEvents:UserEvent[];

@OneToMany(()=>Character,character=>character.)


characters:Character[];

@OneToMany(()=>UserGuildRole,userGuildRole=>userGuildRole.user)


userGuildRoles:UserGuildRole[];

@OneToOne(()=>Author,author=>author.user)


author:Author;

}
