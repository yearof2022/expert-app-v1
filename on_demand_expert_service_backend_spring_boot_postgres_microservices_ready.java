# Project layout (copy these files into a new repo)

```
backend/
├─ pom.xml
├─ src/
│  ├─ main/
│  │  ├─ java/com/odx/experts/
│  │  │  ├─ Application.java
│  │  │  ├─ config/GlobalExceptionHandler.java
│  │  │  ├─ common/{ClockConfig.java, Constants.java, ApiError.java}
│  │  │  ├─ auth/{Role.java, User.java, UserRepository.java, AuthController.java}
│  │  │  ├─ expert/{Domain.java, Expert.java, ExpertRepository.java, AvailabilityOverride.java, AvailabilityWindow.java,
│  │  │  │           AvailabilityOverrideRepository.java, AvailabilityWindowRepository.java, ExpertController.java, SlotService.java}
│  │  │  ├─ purchase/{Purchase.java, PurchaseRepository.java, PurchaseController.java}
│  │  │  ├─ session/{SessionStatus.java, Session.java, SessionRepository.java, BookingService.java, SessionController.java}
│  │  │  ├─ feedback/{Feedback.java, FeedbackRepository.java, FeedbackController.java}
│  │  │  ├─ billing/{Payout.java, PayoutRepository.java, ClientPayment.java, ClientPaymentRepository.java, AdminController.java}
│  │  │  ├─ dto/{BookingDtos.java, CancelDto.java, FeedbackDto.java}
│  │  │  └─ util/{TimeUtil.java, ValidationUtil.java}
│  │  └─ resources/
│  │     ├─ application.yml
│  │     └─ db/migration/V1__init.sql
│  └─ test/java/com/odx/experts/
│     ├─ session/BookingServiceTest.java
│     ├─ session/SessionCancellationTest.java
│     ├─ feedback/FeedbackServiceTest.java
│     └─ expert/SlotServiceTest.java
```

---

## pom.xml
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.odx</groupId>
  <artifactId>experts-backend</artifactId>
  <version>1.0.0</version>
  <properties>
    <java.version>21</java.version>
    <spring.boot.version>3.3.3</spring.boot.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring.boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>

    <!-- Lombok -->
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>

    <!-- Test -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.mockito</groupId>
      <artifactId>mockito-core</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <configuration>
          <source>${java.version}</source>
          <target>${java.version}</target>
          <compilerArgs>
            <arg>-parameters</arg>
          </compilerArgs>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

---

## Application.java
```java
package com.odx.experts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
  public static void main(String[] args) { SpringApplication.run(Application.class, args); }
}
```

---

## resources/application.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/experts
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate.jdbc.time_zone: UTC
  flyway:
    enabled: true
    locations: classpath:db/migration
server:
  port: 8080
```

---

## common/ApiError.java
```java
package com.odx.experts.common;

import org.springframework.http.HttpStatus;

public record ApiError(HttpStatus status, String message) {}
```

## config/GlobalExceptionHandler.java
```java
package com.odx.experts.config;

import com.odx.experts.common.ApiError;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.DateTimeException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class, MethodArgumentNotValidException.class, DateTimeException.class})
  public ResponseEntity<ApiError> badRequest(Exception ex) {
    return ResponseEntity.badRequest().body(new ApiError(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getMessage()));
  }
  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<ApiError> notFound(EntityNotFoundException ex) {
    return ResponseEntity.status(404).body(new ApiError(org.springframework.http.HttpStatus.NOT_FOUND, ex.getMessage()));
  }
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> fallback(Exception ex) {
    return ResponseEntity.internalServerError().body(new ApiError(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage()));
  }
}
```

## common/ClockConfig.java
```java
package com.odx.experts.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ClockConfig {
  @Bean public Clock clock() { return Clock.systemUTC(); }
}
```

## common/Constants.java
```java
package com.odx.experts.common;

public class Constants {
  public static final int SLOT_MIN = 30; // 30-minute slots
}
```

---

## auth/Role.java
```java
package com.odx.experts.auth;

public enum Role { CLIENT, EXPERT, ADMIN }
```

## auth/User.java
```java
package com.odx.experts.auth;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id @GeneratedValue private UUID id;
  @Column(unique = true, nullable = false) private String username;
  @Column(nullable = false) private String password; // NOTE: demo only (plain). Hash in prod.
  @Column(nullable = false) private String name;
  @Column(nullable = false) private String email;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
  @Builder.Default private boolean active = true;
  // if expert, linked expertId
  private UUID expertId;
}
```

## auth/UserRepository.java
```java
package com.odx.experts.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByUsernameAndPasswordAndActiveTrue(String username, String password);
}
```

## auth/AuthController.java
```java
package com.odx.experts.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final UserRepository users;
  public AuthController(UserRepository users) { this.users = users; }

  public record LoginReq(String username, String password) {}
  public record LoginRes(String userId, String name, String email, String role, String expertId) {}

  @PostMapping("/login")
  public ResponseEntity<LoginRes> login(@RequestBody LoginReq req) {
    var u = users.findByUsernameAndPasswordAndActiveTrue(req.username(), req.password())
      .orElseThrow(() -> new IllegalArgumentException("Wrong username/password or inactive"));
    return ResponseEntity.ok(new LoginRes(
      u.getId().toString(), u.getName(), u.getEmail(), u.getRole().name(), u.getExpertId()==null?null:u.getExpertId().toString()
    ));
  }
}
```

---

## expert/Domain.java
```java
package com.odx.experts.expert;

public enum Domain { CYBER, TAX, CORE, PROCURE, REG }
```

## expert/Expert.java
```java
package com.odx.experts.expert;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity @Table(name = "experts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expert {
  @Id @GeneratedValue private UUID id;
  @Column(nullable = false) private String name;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private Domain domain;
  @Column(length = 1000) private String description;
  private String experience;
  private double baseRating; // seed rating; updated via feedback aggregate (read-time)
  private int hourlyRate; // INR per hour
  private String phone; private String email;
  @Builder.Default private String dayStart = "09:00";
  @Builder.Default private String dayEnd = "17:00";
  // default workdays (0=Sun...6=Sat) stored as CSV e.g. "1,2,3,4,5"
  @Builder.Default private String workdays = "1,2,3,4,5";
}
```

## expert/AvailabilityOverride.java
```java
package com.odx.experts.expert;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "availability_override")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilityOverride {
  @Id @GeneratedValue private UUID id;
  @Column(nullable = false) private UUID expertId;
  @Column(nullable = false) private LocalDate date;
  @Builder.Default private boolean workday = true;
  private String dayStart; // HH:mm
  private String dayEnd;   // HH:mm
}
```

## expert/AvailabilityWindow.java
```java
package com.odx.experts.expert;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "availability_window")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilityWindow {
  @Id @GeneratedValue private UUID id;
  @Column(nullable = false) private UUID expertId;
  @Column(nullable = false) private LocalDate date;
  @Column(nullable = false) private int startMin;
  @Column(nullable = false) private int endMin;
}
```

## expert repositories
```java
package com.odx.experts.expert;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List; import java.util.UUID;

public interface ExpertRepository extends JpaRepository<Expert, UUID> {}

public interface AvailabilityOverrideRepository extends JpaRepository<AvailabilityOverride, UUID> {
  List<AvailabilityOverride> findByExpertIdAndDate(UUID expertId, LocalDate date);
}

public interface AvailabilityWindowRepository extends JpaRepository<AvailabilityWindow, UUID> {
  List<AvailabilityWindow> findByExpertIdAndDateOrderByStartMin(UUID expertId, LocalDate date);
}
```

## session/SessionStatus.java
```java
package com.odx.experts.session;

public enum SessionStatus { UPCOMING, COMPLETED, CANCELLED }
```

## session/Session.java
```java
package com.odx.experts.session;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Session {
  @Id @GeneratedValue private UUID id;
  @Column(nullable = false) private UUID userId;
  @Column(nullable = false) private UUID expertId;
  @Column(nullable = false) private UUID purchaseId;
  @Column(nullable = false) private LocalDate date;
  @Column(nullable = false) private int startMin;
  @Column(nullable = false) private int endMin;
  private String link;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private SessionStatus status;
  private String cancelReason; private UUID cancelledBy; private Instant cancelledAt;
  private Instant createdAt;
}
```

## session/SessionRepository.java
```java
package com.odx.experts.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List; import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
  List<Session> findByExpertIdAndDateAndStatusNot(UUID expertId, LocalDate date, SessionStatus status);
  List<Session> findByPurchaseId(UUID purchaseId);
}
```

## purchase/Purchase.java
```java
package com.odx.experts.purchase;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "purchases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase {
  @Id @GeneratedValue private UUID id;
  @Column(nullable = false) private UUID userId;
  @Column(nullable = false) private UUID expertId;
  @Column(nullable = false) private int packageHours; // 1,4,10,20
  @Column(nullable = false) private double hoursRemaining;
  @Column(nullable = false) private int amount; // INR
  @Column(nullable = false) private Instant createdAt;
}
```

## purchase/PurchaseRepository.java
```java
package com.odx.experts.purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.UUID;

public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {
  List<Purchase> findByUserId(UUID userId);
}
```

---

## billing/Payout & ClientPayment
```java
package com.odx.experts.billing;

import jakarta.persistence.*; import lombok.*; import java.time.Instant; import java.util.UUID;

@Entity @Table(name = "payouts") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payout { @Id @GeneratedValue private UUID id; @Column(nullable=false) private UUID expertId; @Column(nullable=false) private int amount; private Instant createdAt; private String note; }

@Entity @Table(name = "client_payments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClientPayment { @Id @GeneratedValue private UUID id; @Column(nullable=false) private UUID userId; @Column(nullable=false) private int amount; private Instant createdAt; private String note; }
```

```java
package com.odx.experts.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.UUID;

public interface PayoutRepository extends JpaRepository<Payout, UUID> { List<Payout> findByExpertId(UUID expertId); }
public interface ClientPaymentRepository extends JpaRepository<ClientPayment, UUID> { List<ClientPayment> findByUserId(UUID userId); }
```

---

## feedback/Feedback.java
```java
package com.odx.experts.feedback;

import jakarta.persistence.*; import lombok.*; import java.time.Instant; import java.util.UUID;

@Entity @Table(name = "feedback")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Feedback {
  @Id @GeneratedValue private UUID id;
  @Column(nullable=false) private UUID userId;
  @Column(nullable=false) private UUID expertId;
  @Column(nullable=false) private UUID purchaseId;
  @Column(nullable=false) private int rating; // 1..5
  @Column(length=2000) private String text;
  private Instant createdAt;
}
```

## feedback/FeedbackRepository.java
```java
package com.odx.experts.feedback;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
  List<Feedback> findByExpertId(UUID expertId);
  boolean existsByPurchaseIdAndUserId(UUID purchaseId, UUID userId);
}
```

---

## dto/BookingDtos.java
```java
package com.odx.experts.dto;

import java.time.LocalDate; import java.util.List; import java.util.UUID;

public record Slot(int startMin, int endMin) {}
public record BatchBookReq(UUID purchaseId, LocalDate date, List<Slot> slots) {}
public record BookedSession(String sessionId, String link) {}
public record BatchBookRes(List<BookedSession> sessions, double hoursDeducted, double hoursRemaining) {}
```

## dto/CancelDto.java
```java
package com.odx.experts.dto;

import java.util.UUID;

public record CancelDto(UUID byUserId, String reason) {}
```

## dto/FeedbackDto.java
```java
package com.odx.experts.dto;

import java.util.UUID;

public record FeedbackReq(UUID purchaseId, int rating, String text, UUID userId) {}
```

---

## util/TimeUtil.java
```java
package com.odx.experts.util;

import java.time.*;

public class TimeUtil {
  public static int toMinutes(String hhmm) {
    var p = hhmm.split(":"); return Integer.parseInt(p[0])*60 + Integer.parseInt(p[1]);
  }
  public static String toHHMM(int minutes) {
    int h = minutes/60, m = minutes%60; return String.format("%02d:%02d", h, m);
  }
  public static boolean overlaps(int aStart, int aEnd, int bStart, int bEnd) {
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  }
  public static Instant atDateAndMinute(LocalDate date, int minute, ZoneId zone) {
    return date.atStartOfDay(zone).plusMinutes(minute).toInstant();
  }
}
```

## util/ValidationUtil.java
```java
package com.odx.experts.util;

import java.time.*;

public class ValidationUtil {
  public static void ensureFuture(LocalDate date, int startMin, Clock clock) {
    var now = Instant.now(clock); var zoned = ZonedDateTime.ofInstant(now, ZoneId.systemDefault());
    var today = zoned.toLocalDate();
    if (date.isBefore(today)) throw new IllegalArgumentException("Cannot book past dates");
    if (date.isEqual(today)) {
      int nowMin = zoned.getHour()*60 + zoned.getMinute();
      if (startMin <= nowMin) throw new IllegalArgumentException("Cannot book past time slots today");
    }
  }
  public static void ensureCancelable(LocalDate date, int startMin, Clock clock) {
    var start = TimeUtil.atDateAndMinute(date, startMin, ZoneId.systemDefault());
    var diff = Duration.between(Instant.now(clock), start);
    if (diff.toHours() < 24) throw new IllegalArgumentException("Cancellation allowed only ≥24h prior");
  }
}
```

---

## expert/SlotService.java
```java
package com.odx.experts.expert;

import com.odx.experts.common.Constants;
import com.odx.experts.session.SessionRepository;
import com.odx.experts.session.SessionStatus;
import com.odx.experts.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service @RequiredArgsConstructor
public class SlotService {
  private final AvailabilityOverrideRepository overridesRepo;
  private final AvailabilityWindowRepository windowRepo;
  private final SessionRepository sessionRepo;

  public List<int[]> slotsForDate(Expert ex, LocalDate date) {
    // existing sessions (not cancelled)
    var sessions = sessionRepo.findByExpertIdAndDateAndStatusNot(ex.getId(), date, SessionStatus.CANCELLED);

    // manual windows else default/override
    var manual = windowRepo.findByExpertIdAndDateOrderByStartMin(ex.getId(), date);
    List<int[]> windows = new ArrayList<>();
    if (!manual.isEmpty()) {
      manual.forEach(w -> windows.add(new int[]{w.getStartMin(), w.getEndMin()}));
    } else {
      var ov = overridesRepo.findByExpertIdAndDate(ex.getId(), date).stream().findFirst().orElse(null);
      boolean workday = true; String start = ex.getDayStart(), end = ex.getDayEnd();
      if (ov != null) { workday = ov.isWorkday(); if (ov.getDayStart()!=null) start = ov.getDayStart(); if (ov.getDayEnd()!=null) end = ov.getDayEnd(); }
      if (!workday) return List.of();
      windows.add(new int[]{ TimeUtil.toMinutes(start), TimeUtil.toMinutes(end) });
    }

    List<int[]> out = new ArrayList<>();
    for (var w : windows) {
      for (int t = w[0]; t + Constants.SLOT_MIN <= w[1]; t += Constants.SLOT_MIN) {
        final int st=t, en=t+Constants.SLOT_MIN;
        boolean clash = sessions.stream().anyMatch(s -> Math.max(st, s.getStartMin()) < Math.min(en, s.getEndMin()));
        if (!clash) out.add(new int[]{st, en});
      }
    }
    out.sort(Comparator.comparingInt(a -> a[0]));
    return out;
  }
}
```

## expert/ExpertController.java
```java
package com.odx.experts.expert;

import com.odx.experts.feedback.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/experts") @RequiredArgsConstructor
public class ExpertController {
  private final ExpertRepository experts;
  private final AvailabilityWindowRepository windows;
  private final FeedbackRepository feedbacks;
  private final SlotService slots;

  @GetMapping
  public List<Map<String,Object>> list() {
    return experts.findAll().stream().map(e -> {
      var fb = feedbacks.findByExpertId(e.getId());
      double avg = fb.isEmpty()? e.getBaseRating() : fb.stream().mapToInt(f->f.getRating()).average().orElse(e.getBaseRating());
      return Map.of(
        "id", e.getId(), "name", e.getName(), "domain", e.getDomain(),
        "description", e.getDescription(), "experience", e.getExperience(),
        "rating", avg, "rate", e.getHourlyRate()
      );
    }).collect(Collectors.toList());
  }

  public record WindowReq(String startHHmm, String endHHmm) {}

  @PostMapping("/{id}/availability/{date}")
  public ResponseEntity<?> addWindow(@PathVariable UUID id, @PathVariable String date, @RequestBody WindowReq req) {
    var d = LocalDate.parse(date);
    var start = com.odx.experts.util.TimeUtil.toMinutes(req.startHHmm());
    var end = com.odx.experts.util.TimeUtil.toMinutes(req.endHHmm());
    if (end - start < 30) throw new IllegalArgumentException("Minimum window 30 minutes");
    windows.save(AvailabilityWindow.builder().expertId(id).date(d).startMin(start).endMin(end).build());
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @GetMapping("/{id}/slots/{date}")
  public List<Map<String,Integer>> slots(@PathVariable UUID id, @PathVariable String date) {
    var ex = experts.findById(id).orElseThrow();
    var res = slots.slotsForDate(ex, LocalDate.parse(date));
    return res.stream().map(a -> Map.of("startMin", a[0], "endMin", a[1])).toList();
  }
}
```

---

## session/BookingService.java
```java
package com.odx.experts.session;

import com.odx.experts.common.Constants;
import com.odx.experts.dto.*;
import com.odx.experts.expert.*;
import com.odx.experts.purchase.Purchase;
import com.odx.experts.purchase.PurchaseRepository;
import com.odx.experts.util.ValidationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class BookingService {
  private final PurchaseRepository purchases;
  private final ExpertRepository experts;
  private final SessionRepository sessions;
  private final SlotService slotService;
  private final Clock clock;

  @Transactional
  public BatchBookRes book(BatchBookReq req, UUID userId) {
    var purchase = purchases.findById(req.purchaseId()).orElseThrow(() -> new IllegalArgumentException("Purchase not found"));
    if (!purchase.getUserId().equals(userId)) throw new IllegalArgumentException("Purchase does not belong to user");
    var expert = experts.findById(purchase.getExpertId()).orElseThrow();

    // validations: future slots, in available slots, enough hours
    var available = slotService.slotsForDate(expert, req.date());
    double requiredHours = req.slots().size() * (Constants.SLOT_MIN/60.0);
    if (requiredHours - purchase.getHoursRemaining() > 1e-6) throw new IllegalArgumentException("Not enough hours remaining");

    List<BookedSession> created = new ArrayList<>();
    for (var s : req.slots()) {
      ValidationUtil.ensureFuture(req.date(), s.startMin(), clock);
      boolean ok = available.stream().anyMatch(a -> a[0]==s.startMin() && a[1]==s.endMin());
      if (!ok) throw new IllegalArgumentException("One or more slots are no longer available");
      var entity = Session.builder()
        .userId(userId).expertId(expert.getId()).purchaseId(purchase.getId())
        .date(req.date()).startMin(s.startMin()).endMin(s.endMin())
        .status(SessionStatus.UPCOMING).link("https://meet.example.com/"+UUID.randomUUID().toString().substring(0,8))
        .createdAt(Instant.now(clock)).build();
      sessions.save(entity);
      created.add(new BookedSession(entity.getId().toString(), entity.getLink()));
    }

    purchase.setHoursRemaining(Math.max(0, purchase.getHoursRemaining() - requiredHours));
    purchases.save(purchase);
    return new BatchBookRes(created, requiredHours, purchase.getHoursRemaining());
  }

  @Transactional
  public void cancel(UUID sessionId, UUID byUserId, String reason) {
    var s = sessions.findById(sessionId).orElseThrow(() -> new IllegalArgumentException("Session not found"));
    ValidationUtil.ensureCancelable(s.getDate(), s.getStartMin(), clock);
    if (s.getStatus() == SessionStatus.CANCELLED) return;
    s.setStatus(SessionStatus.CANCELLED); s.setCancelledBy(byUserId); s.setCancelledAt(Instant.now(clock)); s.setCancelReason(reason);
    sessions.save(s);
    // refund
    var p = purchases.findById(s.getPurchaseId()).orElseThrow();
    double mins = (s.getEndMin() - s.getStartMin());
    p.setHoursRemaining(Math.min(p.getPackageHours(), p.getHoursRemaining() + mins/60.0));
    purchases.save(p);
  }
}
```

## session/SessionController.java
```java
package com.odx.experts.session;

import com.odx.experts.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController @RequestMapping("/api/sessions") @RequiredArgsConstructor
public class SessionController {
  private final BookingService booking;

  @PostMapping("/batch-book/{userId}")
  public ResponseEntity<BatchBookRes> book(@PathVariable UUID userId, @RequestBody BatchBookReq req) {
    return ResponseEntity.ok(booking.book(req, userId));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<?> cancel(@PathVariable UUID id, @RequestBody CancelDto dto) {
    booking.cancel(id, dto.byUserId(), dto.reason());
    return ResponseEntity.ok().build();
  }
}
```

---

## purchase/PurchaseController.java
```java
package com.odx.experts.purchase;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map; import java.util.UUID;

@RestController @RequestMapping("/api/purchases") @RequiredArgsConstructor
public class PurchaseController {
  private final PurchaseRepository purchases;

  public record BuyReq(UUID userId, UUID expertId, int packageHours, int hourlyRate) {}

  @PostMapping
  public ResponseEntity<Map<String,Object>> buy(@RequestBody BuyReq req){
    int amount = req.packageHours * req.hourlyRate;
    var p = purchases.save(Purchase.builder()
      .userId(req.userId()).expertId(req.expertId())
      .packageHours(req.packageHours()).hoursRemaining(req.packageHours())
      .amount(amount).createdAt(Instant.now()).build());
    return ResponseEntity.ok(Map.of("purchaseId", p.getId(), "amount", amount));
  }
}
```

---

## feedback/FeedbackController.java
```java
package com.odx.experts.feedback;

import com.odx.experts.dto.FeedbackReq;
import com.odx.experts.purchase.PurchaseRepository;
import com.odx.experts.session.SessionRepository;
import com.odx.experts.session.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController @RequestMapping("/api/feedback") @RequiredArgsConstructor
public class FeedbackController {
  private final FeedbackRepository repo; private final PurchaseRepository purchases; private final SessionRepository sessions;

  @PostMapping
  public ResponseEntity<?> submit(@RequestBody FeedbackReq req){
    var p = purchases.findById(req.purchaseId()).orElseThrow();
    if (!p.getUserId().equals(req.userId())) throw new IllegalArgumentException("Purchase does not belong to user");
    if (p.getHoursRemaining() > 1e-6) throw new IllegalArgumentException("Feedback allowed after package hours are fully used");
    var sess = sessions.findByPurchaseId(p.getId());
    boolean allDone = sess.stream().allMatch(s -> s.getStatus() != SessionStatus.UPCOMING);
    if (!allDone) throw new IllegalArgumentException("Feedback allowed after all sessions are completed");
    if (repo.existsByPurchaseIdAndUserId(p.getId(), req.userId())) throw new IllegalArgumentException("Feedback already submitted");
    repo.save(Feedback.builder().userId(req.userId()).expertId(p.getExpertId()).purchaseId(p.getId())
      .rating(req.rating()).text(req.text()).createdAt(Instant.now()).build());
    return ResponseEntity.ok().build();
  }
}
```

---

## billing/AdminController.java
```java
package com.odx.experts.billing;

import com.odx.experts.expert.ExpertRepository;
import com.odx.experts.session.SessionRepository;
import com.odx.experts.session.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*; import java.util.stream.Collectors;

@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
  private final PayoutRepository payouts; private final ClientPaymentRepository clientPays; private final ExpertRepository experts; private final SessionRepository sessions;

  public record PayoutReq(UUID expertId, int amount, String note) {}
  public record ClientPayReq(UUID userId, int amount, String note) {}

  @PostMapping("/payouts") public ResponseEntity<?> payout(@RequestBody PayoutReq r){ payouts.save(Payout.builder().expertId(r.expertId()).amount(r.amount()).note(r.note()).createdAt(Instant.now()).build()); return ResponseEntity.ok().build(); }
  @PostMapping("/client-payments") public ResponseEntity<?> clientPay(@RequestBody ClientPayReq r){ clientPays.save(ClientPayment.builder().userId(r.userId()).amount(r.amount()).note(r.note()).createdAt(Instant.now()).build()); return ResponseEntity.ok().build(); }

  @GetMapping("/expert-earnings")
  public List<Map<String,Object>> expertEarnings(){
    return experts.findAll().stream().map(ex -> {
      var past = sessions.findAll().stream().filter(s-> s.getExpertId().equals(ex.getId()) && s.getStatus()!= SessionStatus.CANCELLED && s.getStatus()!= SessionStatus.UPCOMING).toList();
      int earned = (int) Math.round(past.stream().mapToDouble(s -> ((s.getEndMin()-s.getStartMin())/60.0) * ex.getHourlyRate()).sum());
      int paid = payouts.findByExpertId(ex.getId()).stream().mapToInt(Payout::getAmount).sum();
      return Map.of("expertId", ex.getId(), "name", ex.getName(), "earned", earned, "paid", paid, "due", Math.max(0, earned-paid));
    }).collect(Collectors.toList());
  }
}
```

---

## db/migration/V1__init.sql
```sql
create type role as enum ('CLIENT','EXPERT','ADMIN');
create type session_status as enum ('UPCOMING','COMPLETED','CANCELLED');
create type domain as enum ('CYBER','TAX','CORE','PROCURE','REG');

create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  name text not null,
  email text not null,
  role role not null,
  active boolean not null default true,
  expert_id uuid
);

create table experts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain domain not null,
  description text,
  experience text,
  base_rating double precision default 4.5,
  hourly_rate integer not null,
  phone text, email text,
  day_start text default '09:00',
  day_end text default '17:00',
  workdays text default '1,2,3,4,5'
);

create table availability_override (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  date date not null,
  workday boolean not null default true,
  day_start text,
  day_end text
);

create table availability_window (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  date date not null,
  start_min integer not null,
  end_min integer not null
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  expert_id uuid not null,
  package_hours integer not null,
  hours_remaining double precision not null,
  amount integer not null,
  created_at timestamptz not null
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  expert_id uuid not null,
  purchase_id uuid not null,
  date date not null,
  start_min integer not null,
  end_min integer not null,
  link text,
  status session_status not null,
  cancel_reason text,
  cancelled_by uuid,
  cancelled_at timestamptz,
  created_at timestamptz
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  expert_id uuid not null,
  purchase_id uuid not null,
  rating integer not null,
  text text,
  created_at timestamptz
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null,
  amount integer not null,
  created_at timestamptz,
  note text
);

create table client_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount integer not null,
  created_at timestamptz,
  note text
);
```

---

## Test: session/BookingServiceTest.java
```java
package com.odx.experts.session;

import com.odx.experts.dto.*;
import com.odx.experts.expert.*;
import com.odx.experts.purchase.*;
import org.junit.jupiter.api.*;
import org.mockito.Mockito;

import java.time.*; import java.util.*; import static org.junit.jupiter.api.Assertions.*; import static org.mockito.Mockito.*;

class BookingServiceTest {
  private PurchaseRepository purchases; private ExpertRepository experts; private SessionRepository sessions; private SlotService slots; private Clock clock;
  private BookingService svc; private UUID userId = UUID.randomUUID(); private UUID expertId = UUID.randomUUID(); private UUID purchaseId = UUID.randomUUID();

  @BeforeEach void setup(){
    purchases = mock(PurchaseRepository.class); experts = mock(ExpertRepository.class); sessions = mock(SessionRepository.class); slots = mock(SlotService.class);
    clock = Clock.fixed(Instant.parse("2025-09-06T08:00:00Z"), ZoneId.of("UTC"));
    svc = new BookingService(purchases, experts, sessions, slots, clock);
  }

  @Test void booksValidSlotsAndDeductsHours(){
    var p = Purchase.builder().id(purchaseId).userId(userId).expertId(expertId).packageHours(4).hoursRemaining(4).amount(0).createdAt(Instant.now()).build();
    when(purchases.findById(purchaseId)).thenReturn(Optional.of(p));
    when(experts.findById(expertId)).thenReturn(Optional.of(Expert.builder().id(expertId).name("Nikhil").hourlyRate(1000).domain(Domain.CYBER).build()));

    LocalDate d = LocalDate.parse("2025-09-07");
    when(slots.slotsForDate(any(), eq(d))).thenReturn(List.of(new int[]{540, 570}, new int[]{570, 600}));

    var req = new BatchBookReq(purchaseId, d, List.of(new Slot(540,570), new Slot(570,600)));
    var res = svc.book(req, userId);
    assertEquals(2, res.sessions().size());
    assertEquals(1.0, res.hoursDeducted()); // 2*30min = 1h
    verify(purchases).save(Mockito.argThat(pp -> Math.abs(pp.getHoursRemaining() - 3.0) < 1e-6));
  }

  @Test void rejectsPastSlotsToday(){
    var p = Purchase.builder().id(purchaseId).userId(userId).expertId(expertId).packageHours(4).hoursRemaining(4).amount(0).createdAt(Instant.now()).build();
    when(purchases.findById(purchaseId)).thenReturn(Optional.of(p));
    when(experts.findById(expertId)).thenReturn(Optional.of(Expert.builder().id(expertId).name("Nikhil").hourlyRate(1000).domain(Domain.CYBER).build()));
    LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneId.systemDefault());
    when(slots.slotsForDate(any(), eq(today))).thenReturn(List.of(new int[]{300, 330}));

    var req = new BatchBookReq(purchaseId, today, List.of(new Slot(300,330)));
    assertThrows(IllegalArgumentException.class, () -> svc.book(req, userId));
  }
}
```

## Test: session/SessionCancellationTest.java
```java
package com.odx.experts.session;

import com.odx.experts.expert.Domain; import com.odx.experts.expert.Expert; import com.odx.experts.expert.ExpertRepository; import com.odx.experts.purchase.Purchase; import com.odx.experts.purchase.PurchaseRepository;
import org.junit.jupiter.api.*; import java.time.*; import java.util.*; import static org.junit.jupiter.api.Assertions.*; import static org.mockito.Mockito.*;

class SessionCancellationTest {
  private BookingService svc; private PurchaseRepository purchases; private ExpertRepository experts; private SessionRepository sessions; private com.odx.experts.expert.SlotService slotService; private Clock clock;

  @BeforeEach void setup(){
    purchases = mock(PurchaseRepository.class); experts = mock(ExpertRepository.class); sessions = mock(SessionRepository.class); slotService = mock(com.odx.experts.expert.SlotService.class);
    clock = Clock.fixed(Instant.parse("2025-09-01T08:00:00Z"), ZoneId.of("UTC"));
    svc = new BookingService(purchases, experts, sessions, slotService, clock);
  }

  @Test void cancelsAndRefundsWhenBefore24h(){
    var pId = UUID.randomUUID(); var sId = UUID.randomUUID(); var userId = UUID.randomUUID(); var exId = UUID.randomUUID();
    var p = Purchase.builder().id(pId).userId(userId).expertId(exId).packageHours(4).hoursRemaining(3).amount(0).createdAt(Instant.now()).build();
    var s = Session.builder().id(sId).userId(userId).expertId(exId).purchaseId(pId).date(LocalDate.parse("2025-09-03")).startMin(600).endMin(630).status(SessionStatus.UPCOMING).build();
    when(sessions.findById(sId)).thenReturn(Optional.of(s)); when(purchases.findById(pId)).thenReturn(Optional.of(p));

    svc.cancel(sId, userId, "reason");
    verify(purchases).save(argThat(pp -> Math.abs(pp.getHoursRemaining() - 3.5) < 1e-6));
  }

  @Test void rejectsLateCancellation(){
    var pId = UUID.randomUUID(); var sId = UUID.randomUUID(); var userId = UUID.randomUUID(); var exId = UUID.randomUUID();
    var p = Purchase.builder().id(pId).userId(userId).expertId(exId).packageHours(1).hoursRemaining(0).amount(0).createdAt(Instant.now()).build();
    var s = Session.builder().id(sId).userId(userId).expertId(exId).purchaseId(pId).date(LocalDate.parse("2025-09-01")).startMin(600).endMin(630).status(SessionStatus.UPCOMING).build();
    when(sessions.findById(sId)).thenReturn(Optional.of(s)); when(purchases.findById(pId)).thenReturn(Optional.of(p));
    assertThrows(IllegalArgumentException.class, () -> svc.cancel(sId, userId, "late"));
  }
}
```

## Test: feedback/FeedbackServiceTest.java
```java
package com.odx.experts.feedback;

import com.odx.experts.dto.FeedbackReq; import com.odx.experts.purchase.Purchase; import com.odx.experts.purchase.PurchaseRepository; import com.odx.experts.session.*;
import org.junit.jupiter.api.*; import java.util.*; import static org.junit.jupiter.api.Assertions.*; import static org.mockito.Mockito.*;

class FeedbackServiceTest {
  private FeedbackController controller; private FeedbackRepository repo; private PurchaseRepository purchases; private SessionRepository sessions;

  @BeforeEach void setup(){ repo = mock(FeedbackRepository.class); purchases = mock(PurchaseRepository.class); sessions = mock(SessionRepository.class); controller = new FeedbackController(repo, purchases, sessions); }

  @Test void rejectsIfHoursLeft(){
    var pid = UUID.randomUUID(); var uid = UUID.randomUUID(); var exid = UUID.randomUUID();
    when(purchases.findById(pid)).thenReturn(Optional.of(Purchase.builder().id(pid).userId(uid).expertId(exid).packageHours(1).hoursRemaining(0.5).amount(0).build()));
    assertThrows(IllegalArgumentException.class, () -> controller.submit(new FeedbackReq(pid, 5, "good", uid)));
  }
}
```

## Test: expert/SlotServiceTest.java
```java
package com.odx.experts.expert;

import com.odx.experts.session.*; import org.junit.jupiter.api.*; import java.time.*; import java.util.*; import static org.junit.jupiter.api.Assertions.*; import static org.mockito.Mockito.*;

class SlotServiceTest {
  private AvailabilityOverrideRepository ovr; private AvailabilityWindowRepository win; private SessionRepository sess; private SlotService svc;

  @BeforeEach void setup(){ ovr = mock(AvailabilityOverrideRepository.class); win = mock(AvailabilityWindowRepository.class); sess = mock(SessionRepository.class); svc = new SlotService(ovr, win, sess); }

  @Test void computes30MinSlots(){
    var ex = Expert.builder().id(UUID.randomUUID()).dayStart("09:00").dayEnd("10:00").build();
    when(win.findByExpertIdAndDateOrderByStartMin(any(), any())).thenReturn(List.of());
    when(ovr.findByExpertIdAndDate(any(), any())).thenReturn(List.of());
    when(sess.findByExpertIdAndDateAndStatusNot(any(), any(), any())).thenReturn(List.of());
    var slots = svc.slotsForDate(ex, LocalDate.parse("2025-09-10"));
    assertEquals(2, slots.size()); // 09:00-09:30, 09:30-10:00
  }
}
```

---

### Quick start
1) Start Postgres locally and create DB `experts`.
2) `mvn spring-boot:run` (Flyway will create tables).
3) Use the endpoints:
   - `POST /api/auth/login` with `{ "username":"ravi", "password":"ravi123" }` (after you insert users).
   - `GET /api/experts` list experts with current average rating.
   - `POST /api/purchases` to buy hours.
   - `GET /api/experts/{expertId}/slots/{YYYY-MM-DD}` to see open 30‑min slots.
   - `POST /api/sessions/batch-book/{userId}` to book multiple slots at once.
   - `POST /api/sessions/{sessionId}/cancel` to cancel (≥24h, with reason; auto‑refunds hours).
   - `POST /api/feedback` to submit rating+text **only after** package is exhausted and all sessions completed.
   - `GET /api/admin/expert-earnings` to view earnings vs payouts; `POST /api/admin/payouts`, `POST /api/admin/client-payments` to record money movements.

> This single Spring Boot app is **microservices‑ready**: each package (`auth`, `expert`, `session`, `purchase`, `feedback`, `billing`) is a clean bounded context. You can extract them into separate services later by sharing the schema or via events. For production, add JWT auth, proper password hashing, and request validation as needed.
