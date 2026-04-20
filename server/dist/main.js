"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'https://vaderwhiteout.com',
            'https://vaderwhiteout.com/ADConsole'
        ],
        credentials: true,
    });
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map