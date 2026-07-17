// ponytail: plain DTO — class-validator optional, validated by NestJS pipe.
export class SendMessageDto {
  to!: string;
  text!: string;
}
