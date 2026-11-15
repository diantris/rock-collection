// PublishSettings.java - Entity for the single row of global publish settings
package com.rockcollection.publish;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** There is exactly one row (id 1); it's created with the defaults the first time it's needed. */
@Entity
@Table(name = "publish_settings")
public class PublishSettings {
    static final int ID = 1;

    @Id
    private Integer id = ID;

    /** {@link PublishField} names that are published. */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false)
    private List<String> fields = new ArrayList<>();
    /** Text at the top of the public index page; blank lines separate paragraphs. */
    private String intro;
    /** Where the specimen pages' message box sends messages (a Google Apps Script web app); null for no box. */
    private String messageUrl;
    private Instant lastPublishedAt;
    private String lastCommit;

    public List<String> getFields() { return fields; }
    public void setFields(List<String> fields) { this.fields = fields; }
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    public String getMessageUrl() { return messageUrl; }
    public void setMessageUrl(String messageUrl) { this.messageUrl = messageUrl; }
    public Instant getLastPublishedAt() { return lastPublishedAt; }
    public void setLastPublishedAt(Instant lastPublishedAt) { this.lastPublishedAt = lastPublishedAt; }
    public String getLastCommit() { return lastCommit; }
    public void setLastCommit(String lastCommit) { this.lastCommit = lastCommit; }
}
