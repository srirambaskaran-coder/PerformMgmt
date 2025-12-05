import { storage } from "./storage";
import * as sql from 'mssql';
import { getPool } from "./mssql";

interface CalendarEvent {
  subject: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  attendees: Array<{
    email: string;
    name: string;
  }>;
}

interface CalendarProvider {
  type: "google" | "outlook" | "ics";
  credentials?: any;
}

class CalendarService {
  /**
   * Detect which calendar service is configured and available for a specific company
   */
  async detectCalendarProvider(companyId: string): Promise<CalendarProvider> {
    console.log("🔍 Detecting calendar provider for company:", companyId);
    try {
      // Check for Google Calendar credentials and verify token validity
      console.log("🔍 Checking Google Calendar credentials...");
      const googleConfig = await this.getGoogleCalendarConfig(companyId);
      console.log(
        "🔍 Google config result:",
        googleConfig ? "Found credentials" : "No credentials found"
      );

      if (googleConfig && (await this.verifyGoogleToken(googleConfig))) {
        console.log(
          "✅ Google Calendar provider selected - real calendar events will be created"
        );
        return { type: "google", credentials: googleConfig };
      }

      // Check for Outlook credentials and verify token validity
      console.log("🔍 Checking Outlook Calendar credentials...");
      const outlookConfig = await this.getOutlookCalendarConfig(companyId);
      console.log(
        "🔍 Outlook config result:",
        outlookConfig ? "Found credentials" : "No credentials found"
      );

      if (outlookConfig && (await this.verifyOutlookToken(outlookConfig))) {
        console.log(
          "✅ Outlook Calendar provider selected - real calendar events will be created"
        );
        return { type: "outlook", credentials: outlookConfig };
      }

      // Fallback to ICS attachments
      console.log(
        "⚠️ No calendar API configured - falling back to ICS attachments"
      );
      return { type: "ics" };
    } catch (error) {
      console.log(
        "❌ Calendar provider detection failed, falling back to ICS:",
        error
      );
      return { type: "ics" };
    }
  }

  /**
   * Create a calendar event using the appropriate service for a specific company
   */
  async createCalendarEvent(
    event: CalendarEvent,
    companyId: string
  ): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
    provider: string;
  }> {
    console.log("📅 Creating calendar event for company:", companyId);
    console.log("📅 Event details:", {
      subject: event.subject,
      attendees: event.attendees.map((a) => a.email),
    });

    const provider = await this.detectCalendarProvider(companyId);
    console.log("📅 Using provider:", provider.type);

    try {
      switch (provider.type) {
        case "google":
          console.log(
            "📅 Creating Google Calendar event with sendUpdates: all"
          );
          const googleResult = await this.createGoogleCalendarEvent(
            event,
            provider.credentials
          );
          console.log("📅 Google Calendar result:", googleResult);
          return { ...googleResult, provider: "google" };
        case "outlook":
          console.log("📅 Creating Outlook Calendar event");
          const outlookResult = await this.createOutlookCalendarEvent(
            event,
            provider.credentials
          );
          console.log("📅 Outlook Calendar result:", outlookResult);
          return { ...outlookResult, provider: "outlook" };
        case "ics":
        default:
          console.log("📅 Using ICS fallback - no real calendar event created");
          // Return success for ICS fallback (will be handled by email service)
          return { success: true, eventId: "ics-fallback", provider: "ics" };
      }
    } catch (error) {
      console.error("❌ Calendar event creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: provider.type,
      };
    }
  }

  /**
   * Google Calendar API integration
   */
  private async createGoogleCalendarEvent(
    event: CalendarEvent,
    credentials: any
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const { google } = await import("googleapis");

      // Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        credentials.redirectUri
      );

      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const googleEvent = {
        summary: event.subject,
        description: event.description,
        start: {
          dateTime: event.startDateTime.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: event.endDateTime.toISOString(),
          timeZone: "UTC",
        },
        location: event.location,
        attendees: event.attendees.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.name,
        })),
        sendUpdates: "all", // Send email notifications to attendees
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: googleEvent,
      });

      return {
        success: true,
        eventId: response.data.id || undefined,
      };
    } catch (error) {
      console.error("Google Calendar API error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Google Calendar API error",
      };
    }
  }

  /**
   * Microsoft Graph API (Outlook) integration
   */
  private async createOutlookCalendarEvent(
    event: CalendarEvent,
    credentials: any
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Microsoft Graph API call
      const outlookEvent = {
        subject: event.subject,
        body: {
          contentType: "HTML",
          content: event.description,
        },
        start: {
          dateTime: event.startDateTime.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: event.endDateTime.toISOString(),
          timeZone: "UTC",
        },
        location: {
          displayName: event.location || "",
        },
        attendees: event.attendees.map((attendee) => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: "required",
        })),
      };

      const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/calendar/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(outlookEvent),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Outlook API error: ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const result = await response.json();
      return {
        success: true,
        eventId: result.id,
      };
    } catch (error) {
      console.error("Outlook Calendar API error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Outlook Calendar API error",
      };
    }
  }

  /**
   * Verify and refresh Google Calendar token if needed
   */
  private async verifyGoogleToken(config: any): Promise<boolean> {
    try {
      // If we have a valid access token, check if it works
      if (config.accessToken) {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" +
            config.accessToken
        );
        if (response.ok) {
          return true;
        }
      }

      // If access token is invalid or missing, try to refresh using refresh token
      if (config.refreshToken && config.clientId && config.clientSecret) {
        const refreshed = await this.refreshGoogleToken(config);
        if (refreshed) {
          // Update config with new access token
          config.accessToken = refreshed.accessToken;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Google token verification failed:", error);
      return false;
    }
  }

  /**
   * Verify and refresh Outlook token if needed
   */
  private async verifyOutlookToken(config: any): Promise<boolean> {
    try {
      // If we have a valid access token, check if it works
      if (config.accessToken) {
        const response = await fetch(
          "https://graph.microsoft.com/v1.0/me/calendar",
          {
            headers: { Authorization: `Bearer ${config.accessToken}` },
          }
        );
        if (response.ok) {
          return true;
        }
      }

      // If access token is invalid or missing, try to refresh using refresh token
      if (config.refreshToken && config.clientId && config.clientSecret) {
        const refreshed = await this.refreshOutlookToken(config);
        if (refreshed) {
          // Update config with new access token
          config.accessToken = refreshed.accessToken;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Outlook token verification failed:", error);
      return false;
    }
  }

  /**
   * Refresh Google Calendar access token and persist to database
   */
  private async refreshGoogleToken(
    config: any
  ): Promise<{ accessToken: string } | null> {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: config.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access_token;
        const expiresIn = data.expires_in; // seconds
        const expiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : undefined;

        // Persist the new token to database via SP
        const pool = await getPool();
        await pool
          .request()
          .input("CompanyId", sql.NVarChar(100), config.companyId)
          .input("Provider", sql.NVarChar(20), "google")
          .input("AccessToken", sql.NVarChar(sql.MAX), newAccessToken)
          .input("RefreshToken", sql.NVarChar(sql.MAX), null)
          .input("ExpiresAt", sql.DateTimeOffset, expiresAt ?? null)
          .execute("dbo.UpdateCalendarCredentialTokens");

        return { accessToken: newAccessToken };
      }

      return null;
    } catch (error) {
      console.error("Google token refresh failed:", error);
      return null;
    }
  }

  /**
   * Refresh Outlook access token and persist to database
   */
  private async refreshOutlookToken(
    config: any
  ): Promise<{ accessToken: string } | null> {
    try {
      const response = await fetch(
        `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: config.refreshToken,
            grant_type: "refresh_token",
            scope:
              "https://graph.microsoft.com/Calendars.ReadWrite offline_access",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token; // Microsoft rotates refresh tokens
        const expiresIn = data.expires_in; // seconds
        const expiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : undefined;

        // Persist the new tokens to database via SP
        const pool = await getPool();
        await pool
          .request()
          .input("CompanyId", sql.NVarChar(100), config.companyId)
          .input("Provider", sql.NVarChar(20), "outlook")
          .input("AccessToken", sql.NVarChar(sql.MAX), newAccessToken)
          .input("RefreshToken", sql.NVarChar(sql.MAX), newRefreshToken ?? null)
          .input("ExpiresAt", sql.DateTimeOffset, expiresAt ?? null)
          .execute("dbo.UpdateCalendarCredentialTokens");

        return { accessToken: newAccessToken };
      }

      return null;
    } catch (error) {
      console.error("Outlook token refresh failed:", error);
      return null;
    }
  }

  /**
   * Get Google Calendar configuration from database for a specific company
   */
  private async getGoogleCalendarConfig(
    companyId: string
  ): Promise<any | null> {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("CompanyId", sql.NVarChar(100), companyId)
        .input("Provider", sql.NVarChar(20), "google")
        .execute("dbo.GetCalendarCredential");
      const credential = result.recordset?.[0];
      if (!credential) {
        return null;
      }

      return {
        id: credential.Id,
        clientId: credential.ClientId,
        clientSecret: credential.ClientSecret,
        refreshToken: credential.RefreshToken,
        accessToken: credential.AccessToken,
        redirectUri: "urn:ietf:wg:oauth:2.0:oob",
        companyId: credential.CompanyId,
      };
    } catch (error) {
      console.error("Error getting Google Calendar config:", error);
      return null;
    }
  }

  /**
   * Get Outlook Calendar configuration from database for a specific company
   */
  private async getOutlookCalendarConfig(
    companyId: string
  ): Promise<any | null> {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("CompanyId", sql.NVarChar(100), companyId)
        .input("Provider", sql.NVarChar(20), "outlook")
        .execute("dbo.GetCalendarCredential");
      const credential = result.recordset?.[0];
      if (!credential) {
        return null;
      }

      return {
        id: credential.Id,
        accessToken: credential.AccessToken,
        refreshToken: credential.RefreshToken,
        clientId: credential.ClientId,
        clientSecret: credential.ClientSecret,
        companyId: credential.CompanyId,
      };
    } catch (error) {
      console.error("Error getting Outlook Calendar config:", error);
      return null;
    }
  }

  /**
   * Helper method to convert meeting details to CalendarEvent format
   */
  convertMeetingToCalendarEvent(
    employeeName: string,
    managerName: string,
    employeeEmail: string,
    managerEmail: string,
    meetingDate: Date,
    duration: number = 60,
    location?: string,
    notes?: string
  ): CalendarEvent {
    const endDateTime = new Date(meetingDate.getTime() + duration * 60 * 1000);

    let description = `One-on-one performance review meeting between ${employeeName} and ${managerName}`;
    if (notes) {
      description += `\n\nNotes: ${notes}`;
    }

    return {
      subject: `Performance Review Meeting - ${employeeName} (${duration}min)`,
      description,
      startDateTime: meetingDate,
      endDateTime,
      location,
      attendees: [
        { email: employeeEmail, name: employeeName },
        { email: managerEmail, name: managerName },
      ],
    };
  }
}

const calendarService = new CalendarService();

/**
 * Create a calendar event for a performance review meeting
 */
export async function createPerformanceReviewMeeting(
  employeeName: string,
  managerName: string,
  employeeEmail: string,
  managerEmail: string,
  meetingDate: Date,
  companyId: string,
  duration?: number,
  location?: string,
  notes?: string
): Promise<{
  success: boolean;
  eventId?: string;
  error?: string;
  provider: string;
}> {
  const calendarEvent = calendarService.convertMeetingToCalendarEvent(
    employeeName,
    managerName,
    employeeEmail,
    managerEmail,
    meetingDate,
    duration,
    location,
    notes
  );

  const result = await calendarService.createCalendarEvent(
    calendarEvent,
    companyId
  );

  return result;
}

export { CalendarService };
