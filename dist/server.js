"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const lodash_1 = __importDefault(require("lodash"));
const database_1 = __importDefault(require("./config/database"));
const morgan_1 = __importDefault(require("./config/morgan"));
const winston_1 = __importDefault(require("./config/winston"));
const Catalog_1 = __importDefault(require("./models/Catalog"));
const file_1 = __importDefault(require("./routes/api/file"));
const admin_1 = __importDefault(require("./routes/api/admin"));
const store_1 = __importDefault(require("./routes/api/store"));
const user_1 = __importDefault(require("./routes/api/user"));
const customer_1 = __importDefault(require("./routes/api/customer"));
const app = express_1.default();
// Connect to MongoDB
database_1.default();
app.use(cors_1.default());
app.set('port', process.env.PORT || 3005);
// Middlewares configuration
app.use(helmet_1.default());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded());
app.use(morgan_1.default);
// @route   GET /
// @desc    Liveliness base API
// @access  Public
app.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send('ok');
}));
app.get('/test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send({ message: 'Server is started successfully' });
}));
app.use(`/user`, user_1.default);
app.use(`/admin`, admin_1.default);
app.use('/store', store_1.default);
app.use('/file', file_1.default);
app.use('/customer', customer_1.default);
app.get('/category', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryList = yield Catalog_1.default.find({ parent: 'root' });
    const result = categoryList.map(({ _id, catalogName, catalogIcon }) => {
        return { _id, catalogName, catalogIcon };
    });
    res.json({
        list: result
    });
}));
app.get('/subCategory', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryList = yield Catalog_1.default.find({
        tree: `root/${req.query.category}`
    });
    const result = categoryList.map(({ _id, catalogName }) => {
        return { _id, catalogName };
    });
    res.json({
        list: result
    });
}));
// TODO: Remove this api once app is launched to  production
app.get('/brand', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryList = yield Catalog_1.default.find({
        tree: `root/${req.query.category}/${req.query.subCategory}`
    });
    const result = categoryList.map(({ _id, catalogName }) => {
        return { _id, catalogName };
    });
    res.json({
        list: result
    });
}));
app.post('/brand', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subCategoryList, category } = req.body;
    let query = {};
    const treeVal = [];
    if (Array.isArray(subCategoryList)) {
        subCategoryList.forEach((subCat) => {
            treeVal.push(`root/${category}/${subCat}`);
        });
    }
    else {
        treeVal.push(`root/${category}/${subCategoryList}`);
    }
    query = { tree: { $in: treeVal } };
    const categoryList = yield Catalog_1.default.find(query);
    let result = categoryList.map(({ _id, catalogName }) => {
        return { _id, catalogName };
    });
    result = lodash_1.default.uniqBy(result, (e) => {
        return e.catalogName;
    });
    res.json({
        list: result
    });
}));
const port = app.get('port');
const server = app.listen(port, () => winston_1.default.debug(`Server started on port ${port}`));
exports.default = server;
//# sourceMappingURL=server.js.map