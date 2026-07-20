import type { Meta, StoryObj } from "@storybook/react";
import { DocumentUploader } from "../features/portal/components/document-uploader";

const meta: Meta<typeof DocumentUploader> = {
  title: "Portal/DocumentUploader",
  component: DocumentUploader,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DocumentUploader>;

export const Default: Story = {
  args: {
    onUpload: async () => {},
  },
};
