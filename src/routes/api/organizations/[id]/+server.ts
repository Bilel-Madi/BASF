// src/routes/api/organizations/[id]/+server.ts

export const GET: RequestHandler = async ({ params, locals }) => {
    const user = locals.user;
    const orgId = params.id;
  
    if (!user || user.role !== 'SUPER_ADMIN') {
      return new Response('Unauthorized', { status: 401 });
    }
  
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          users: true,
          zones: true,
        },
      });
  
      if (!organization) {
        return new Response('Organization not found', { status: 404 });
      }
  
      return json(organization);
    } catch (error) {
      console.error('Error fetching organization:', error);
      return new Response('Server error', { status: 500 });
    }
  };
  
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  const orgId = params.id;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();

    const updatedOrganization = await prisma.organization.update({
      where: { id: orgId },
      data,
    });

    return json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return new Response('Server error', { status: 500 });
  }
};
  