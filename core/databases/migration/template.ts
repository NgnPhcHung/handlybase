export abstract class Migration {
  abstract up(queryRunner: any): Promise<void>;
  abstract down(queryRunner: any): Promise<void>;
}
