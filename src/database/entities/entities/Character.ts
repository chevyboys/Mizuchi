import {Column,Entity,Index,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from "typeorm";
import {Users} from './Users'


@Index("character_users_FK",["id",],{  })
@Entity("character" ,{schema:"Tavare" } )
export  class Character {

@PrimaryGeneratedColumn({ type:"double", name:"id",precision:22 })
id:number;

@Column("double",{ name:"user_id",precision:22 })
userId:number;

@Column("varchar",{ name:"name",nullable:true,length:100 })
name:string | null;

@Column("tinytext",{ name:"url",nullable:true })
url:string | null;

@Column("datetime",{ name:"date_created",default: () => "CURRENT_TIMESTAMP", })
dateCreated:Date;

@Column("varchar",{ name:"system",nullable:true,length:100 })
system:string | null;

@ManyToOne(()=>Users,users=>users.characters,{ onDelete:"CASCADE",onUpdate:"CASCADE" })
@JoinColumn([{ name: "id", referencedColumnName: "id" },
])

:Users;

}
