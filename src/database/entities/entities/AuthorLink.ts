import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Author } from "./Author";

@Index("author_link_author_id_IDX", ["authorId"], {})
@Entity("author_link", { schema: "Tavare" })
export class AuthorLink {
  @PrimaryGeneratedColumn({ type: "double", name: "id", precision: 22 })
  id: number;

  @Column("double", { name: "author_id", precision: 22 })
  authorId: number;

  @Column("varchar", { name: "name", length: 100 })
  name: string;

  @Column("varchar", { name: "url", length: 100 })
  url: string;

  @ManyToOne(() => Author, (author) => author.authorLinks, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "author_id", referencedColumnName: "id" }])
  author: Author;
}
