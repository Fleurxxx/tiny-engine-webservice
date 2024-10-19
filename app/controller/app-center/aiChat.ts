/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */
import { Controller } from 'egg';
import { E_FOUNDATION_MODEL } from '../../lib/enum';
import { Buffer } from 'buffer';

class File {
  blob: Blob;
  name: string;
  type: string;
  size: number;
  lastModified: number;

  constructor(blob: Blob, fileName: string, mimeType: string) {
    this.blob = blob;
    this.name = fileName;
    this.type = mimeType;
    this.size = blob.size;
    this.lastModified = Date.now();
  }
}

async function convertFileStreamToFile(fileStream) {
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    fileStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    fileStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    fileStream.on('error', reject);
  });

  const blob = new Blob([buffer], { type: 'image/png' });
  console.log(blob);

  //@ts-ignore
  // const file = new File([blob], 'uploaded_file.png', { type: 'image/png' });
  const file = new File(blob, 'uploaded_file.png', 'image/png');

  return file;
}

export default class AiChatController extends Controller {

  public async aiChat() {
    const { ctx } = this;
    const { foundationModel, messages } = ctx.request.body;
    this.ctx.logger.info('ai接口请求参参数 model选型:', foundationModel);
    if (!messages || !Array.isArray(messages)) {
      return this.ctx.helper.getResponseData('Not passing the correct message parameter');
    }
    const model = foundationModel?.model ?? E_FOUNDATION_MODEL.GPT_35_TURBO;
    const token = foundationModel.token;
    ctx.body = await ctx.service.appCenter.aiChat.getAnswerFromAi(messages, { model, token });
  }


  public async uploadFile() {
    const { ctx } = this;
    const fileStream = await ctx.getFileStream();
    const foundationModelObject = JSON.parse(fileStream.fields.foundationModel);
    console.log('============');
    // console.log(await convertFileStreamToFile(fileStream));
    const convertFile = await convertFileStreamToFile(fileStream);

    const { model, token } = foundationModelObject.foundationModel;
    ctx.body = await ctx.service.appCenter.aiChat.getFileContentFromAi(convertFile, { model, token });
  }
}

