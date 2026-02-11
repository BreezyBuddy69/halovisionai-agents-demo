export interface Agent {
  id: string;
  name: string;
  description: string;
  webhook: string;
  domain: string;
}

export const agents: Agent[] = [
  {
    id: "halovision",
    name: "Halo Vision AI",
    description: "Custom AI agent solutions",
    webhook: "https://n8n.halo-vision.com/webhook/halovisionchatbot99",
    domain: "halovisionai.cloud",
  },
  {
    id: "chiroli",
    name: "Chiro.li",
    description: "Chiropractor assistant",
    webhook: "https://n8n.halo-vision.com/webhook/chiroli-86767",
    domain: "chiro.li",
  },
  {
    id: "safe3d",
    name: "Safe-3D",
    description: "Messtechniker assistant",
    webhook: "https://n8n.halo-vision.com/webhook/01f863a3-331a-495d-bdc1-4972c1657f5d",
    domain: "safe-3d.ch",
  },
  {
    id: "simplygerman",
    name: "Simply German",
    description: "German language lessons",
    webhook: "https://n8n.halo-vision.com/webhook/deutschbot",
    domain: "simply-german.bolt.host",
  },
];
