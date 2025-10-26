import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NO_ROWS_CODE = 'PGRST116';
const VALID_STATUSES = new Set(['connected', 'disconnected', 'pending', 'error']);

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('org_id');
    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('erp_connections')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== NO_ROWS_CODE) {
      console.error('Error fetching ERP connection:', error);
      return NextResponse.json({ error: 'Unable to fetch ERP connection' }, { status: 500 });
    }

    return NextResponse.json({ connection: data ?? null });
  } catch (error) {
    console.error('Error in GET /api/erp-connections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      org_id,
      base_url,
      database_name,
      company_id,
      auth_type,
      api_key,
      client_id,
      client_secret,
      status,
      provider = 'odoo',
    } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    if (!base_url || typeof base_url !== 'string' || !base_url.trim()) {
      return NextResponse.json({ error: 'base_url is required' }, { status: 400 });
    }

    // Validar que la URL tenga un formato correcto
    let normalizedUrl: string;
    try {
      const parsedUrl = new URL(base_url.trim());
      normalizedUrl = parsedUrl.origin;
    } catch {
      return NextResponse.json({ error: 'base_url must be a valid URL' }, { status: 400 });
    }

    const normalizedCompanyId =
      company_id === null || company_id === undefined || company_id === ''
        ? null
        : Number(company_id);

    if (Number.isNaN(normalizedCompanyId)) {
      return NextResponse.json({ error: 'company_id must be a number' }, { status: 400 });
    }

    const normalizedStatus = VALID_STATUSES.has(status) ? status : 'disconnected';
    const normalizedAuthType = auth_type === 'oauth' ? 'oauth' : 'api_key';

    const payload = {
      provider: provider || 'odoo',
      base_url: normalizedUrl,
      database_name: database_name?.trim() || null,
      company_id: normalizedCompanyId,
      auth_type: normalizedAuthType,
      api_key: normalizedAuthType === 'api_key' ? api_key?.trim() || null : null,
      client_id: normalizedAuthType === 'oauth' ? client_id?.trim() || null : null,
      client_secret: normalizedAuthType === 'oauth' ? client_secret?.trim() || null : null,
      status: normalizedStatus,
    };

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from('erp_connections')
      .select('id')
      .eq('org_id', org_id)
      .single();

    if (existingError && existingError.code !== NO_ROWS_CODE) {
      console.error('Error checking existing ERP connection:', existingError);
      return NextResponse.json({ error: 'Unable to verify existing connection' }, { status: 500 });
    }

    const mutation = existing
      ? supabase.from('erp_connections').update(payload).eq('org_id', org_id).select().single()
      : supabase.from('erp_connections').insert({ ...payload, org_id }).select().single();

    const { data, error } = await mutation;

    if (error) {
      console.error('Error saving ERP connection:', error);
      return NextResponse.json(
        { error: 'Unable to save ERP connection', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ connection: data });
  } catch (error) {
    console.error('Error in POST /api/erp-connections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('org_id');
    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('erp_connections').delete().eq('org_id', orgId);

    if (error) {
      console.error('Error deleting ERP connection:', error);
      return NextResponse.json({ error: 'Unable to delete ERP connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/erp-connections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
