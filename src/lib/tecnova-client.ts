import {TecnovaClient} from "@evovee/tecnova-api";

let client: TecnovaClient;

export const tecnovaClient = () => {
    if (!client) {
        client = new TecnovaClient();
    }
    return client;
}