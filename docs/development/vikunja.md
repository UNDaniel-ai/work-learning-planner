# Vikunja Integration

The planner talks to Vikunja through API v2.

The API shape used here is grounded in the [Vikunja API v2 OpenAPI document](https://try.vikunja.io/api/v2/openapi.json).

## Configuration

Set these values in `.env`:

```bash
VIKUNJA_BASE_URL=https://vikunja.example.com
VIKUNJA_API_TOKEN=your-api-token
```

`VIKUNJA_BASE_URL` may point either to the instance root or directly to `/api/v2`; the client normalizes both forms.

## MVP Endpoints

- `GET /api/v2/tasks`: list visible tasks across accessible projects.
- `POST /api/v2/projects/{project}/tasks`: create a task in a project.
- `PATCH /api/v2/tasks/{task}`: complete, postpone, or partially update a task.

The app uses Bearer token authentication and never returns the token from health or connection-check API responses.

The Settings page calls the connection-check endpoint from the browser and only displays the connection state and task count. The token remains server-side.

## Current Boundary

Labels are read from task responses. Label writes are deferred until the UI needs them because Vikunja v2 manages labels through separate label and task-label endpoints that require label IDs.

The planner JSON export contains local planning records and external task-link snapshots. It does not contain the Vikunja base URL, API token, or other process environment variables.
