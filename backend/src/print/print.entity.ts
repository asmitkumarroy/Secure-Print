export class PrintEntity {
  documentId!: string;
  status!: 'pending' | 'completed' | 'failed';
}
