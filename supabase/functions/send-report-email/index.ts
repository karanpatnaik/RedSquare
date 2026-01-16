import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RECIPIENTS = [
  "kdp77@georgetown.edu",
  "km1897@georgetown.edu",
  "pra21@georgetown.edu",
];

interface ReportPayload {
  type: "INSERT";
  table: "reports";
  record: {
    id: string;
    post_id: string;
    post_title: string | null;
    post_description: string | null;
    post_location: string | null;
    post_event_date: string | null;
    post_user_id: string | null;
    post_club_id: string | null;
    post_created_at: string | null;
    post_image_url: string | null;
    reported_by: string | null;
    reported_at: string;
    status: string;
  };
}

serve(async (req) => {
  try {
    const payload: ReportPayload = await req.json();
    const report = payload.record;

    const emailHtml = `
      <h2>New Post Report on RedSquare</h2>

      <h3>Reported Post Details</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Report ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.id}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Post ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_id}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Title</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_title || "Untitled"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Description</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_description || "No description"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Location</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_location || "No location"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Event Date</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_event_date || "No date"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Posted By User ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_user_id || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Club ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_club_id || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Post Created At</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.post_created_at || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reported By User ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.reported_by || "Anonymous"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reported At</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${report.reported_at}</td>
        </tr>
      </table>

      ${report.post_image_url ? `<p><strong>Post Image:</strong> <a href="${report.post_image_url}">View Image</a></p>` : ""}

      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated email from RedSquare. Please review this report in the Supabase dashboard.
      </p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RedSquare Reports <reports@redsquare.app>",
        to: RECIPIENTS,
        subject: `[RedSquare Report] Post: ${report.post_title || "Untitled"}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending report email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
