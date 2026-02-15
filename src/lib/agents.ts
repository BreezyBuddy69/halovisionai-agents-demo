export interface Agent {
  id: string;
  name: string;
  description: string;
  webhook: string;
  testWebhook: string;
  domain: string;
}

export const agents: Agent[] = [
  {
    id: "halovision",
    name: "Halo Vision AI",
    description: "Custom AI agent solutions",
    webhook: "https://n8n.halovisionai.cloud/webhook/halovisionchatbot997655",
    testWebhook: "https://n8n.halovisionai.cloud/webhook-test/halovisionchatbot997655",
    domain: "halovisionai.cloud",
  },
  {
    id: "chiroli",
    name: "Chiro.li",
    description: "Chiropractor assistant",
    webhook: "https://n8n.halovisionai.cloud/webhook/chiroli-86767",
    testWebhook: "https://n8n.halovisionai.cloud/webhook-test/chiroli-86767",
    domain: "chiro.li",
  },
  {
    id: "safe3d",
    name: "Safe-3D",
    description: "Messtechniker assistant",
    webhook: "https://n8n.halovisionai.cloud/webhook/safe3d-331a-495d-bdc1-4972c1657f5d",
    testWebhook: "https://n8n.halovisionai.cloud/webhook-test/safe3d-331a-495d-bdc1-4972c1657f5d",
    domain: "safe-3d.ch",
  },
  {
    id: "simplygerman",
    name: "Simply German",
    description: "German language lessons",
    webhook: "https://n8n.halovisionai.cloud/webhook/deutschbot9987633",
    testWebhook: "https://n8n.halovisionai.cloud/webhook-test/deutschbot9987633",
    domain: "simply-german.bolt.host",
  },
];
