import { INestApplication } from "@nestjs/common/interfaces/nest-application.interface";
import { startSocket } from "./paperStream";
// import { customEvent } from '@src/app.module';


export function watchCollection(app: INestApplication) {
  // console.log(customEvent);
  // customEvent.on('app_started', () => {
  //   console.log('it worked')
    startSocket(app);
  // });
}
