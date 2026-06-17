import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// scope === "password_change_only" identifie un token court délivré aux
// utilisateurs avec mustChangePassword=true, valable uniquement pour
// finaliser leur mot de passe via /auth/finalize.
export type JwtPayload = {
  sub: string;
  email: string;
  role: 'ROOT' | 'MEMBER';
  scope?: 'password_change_only';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      scope: payload.scope,
    };
  }
}
