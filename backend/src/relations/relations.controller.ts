import { Body, Controller, Post, UseGuards, Req, Param, Delete, Patch } from '@nestjs/common';
import { RelationsService, CreateLeadDto, CreateLeadPublicDto } from './relations.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Get } from '@nestjs/common';

@Controller('relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Post('lead')
  @UseGuards(JwtGuard)
  async createLead(@Body() dto: Omit<CreateLeadDto, 'clientId'>, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.createLead({ ...dto, clientId: userId });
  }

  @Post('lead-public')
  async createLeadPublic(@Body() dto: CreateLeadPublicDto) {
    return this.relationsService.createLeadPublic(dto);
  }

  @Get('mine-client')
  @UseGuards(JwtGuard)
  async myRelationsForClient(@Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.listForClient(userId);
  }

  @Get('my-leads')
  @UseGuards(JwtGuard)
  async myLeads(@Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.listLeadsForConsultant(userId);
  }

  @Get('my-clients')
  @UseGuards(JwtGuard)
  async myClients(@Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.listClientsForConsultant(userId);
  }

  @Post('leads/:id/accept')
  @UseGuards(JwtGuard)
  async accept(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.acceptLead(userId, Number(id));
  }

  @Delete('leads/:id')
  @UseGuards(JwtGuard)
  async reject(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.rejectLead(userId, Number(id));
  }

  @Patch(':id/notes')
  @UseGuards(JwtGuard)
  async updateNotes(@Param('id') id: string, @Body() body: { notes: string }, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.updateNotes(userId, Number(id), body?.notes ?? '');
  }

  @Delete('clients/:id')
  @UseGuards(JwtGuard)
  async deleteClient(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId as number;
    return this.relationsService.deleteClient(userId, Number(id));
  }
}


